import { clamp01 } from "./util.js";

const MAX_TEXT_CHARS = 24000;

/**
 * @param {string} fileText
 * @param {import("./file-processor").Discount[]} possibleDiscounts
 * @returns {Promise<import("./file-processor").DiscountMatch[]>}
 */
export async function inferDiscountsOllama(fileText, possibleDiscounts) {
	const trimmed = fileText.slice(0, MAX_TEXT_CHARS);

	const summary = await chatJson([
		{
			role: "system",
			content:
				"You analyse student support documents. Reply ONLY with JSON of shape " +
				'{"documentType": string, "keywords": string[], "facts": object}. ' +
				"documentType is a short label (e.g. 'transcript', 'medical certificate'). " +
				"keywords are 3-10 short phrases capturing eligibility-relevant content. " +
				"facts is a flat object of any concrete claims (gpa, income, disability code, etc.).",
		},
		{ role: "user", content: trimmed },
	]);

	const matchResult = await chatJson([
		{
			role: "system",
			content:
				"You decide which student discounts a document supports as evidence. " +
				"You receive a structured summary of the document and a list of available discounts. " +
				'Reply ONLY with JSON of shape {"matches": [{"discountId": string, "confidence": number, "reason": string}]}. ' +
				"discountId MUST be one of the provided ids. confidence is between 0 and 1. " +
				"reason is one short sentence citing evidence from the summary. " +
				"Return an empty matches array if nothing fits.",
		},
		{
			role: "user",
			content: JSON.stringify({
				summary,
				discounts: possibleDiscounts.map((d) => ({
					id: d.id,
					name: d.name,
					description: d.description,
					requiredDocuments: d.requiredDocuments,
				})),
			}),
		},
	]);

	const validIds = new Set(possibleDiscounts.map((d) => d.id));
	/** @type {any[]} */
	const raw =
		typeof matchResult === "object" &&
		matchResult !== null &&
		"matches" in matchResult &&
		Array.isArray(matchResult.matches)
			? matchResult.matches
			: [];
	return raw
		.filter(
			(m) =>
				m && typeof m.discountId === "string" && validIds.has(m.discountId),
		)
		.map((m) => ({
			discountId: /** @type {string} */ (m.discountId),
			confidence: clamp01(Number(m.confidence)),
			reason: typeof m.reason === "string" ? m.reason : "",
		}));
}

/**
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<unknown>}
 */
async function chatJson(messages) {
	const baseUrl = process.env.OLLAMA_BASE_URL ?? "https://ollama.com";
	const apiKey = process.env.OLLAMA_API_KEY;
	const model = process.env.OLLAMA_MODEL ?? "gpt-oss:120b";
	if (!apiKey) {
		throw new Error("OLLAMA_API_KEY is not set");
	}

	console.log(`[Ollama:${model}] request:`, messages);
	const res = await fetch(`${baseUrl}/api/chat`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			messages,
			stream: false,
			format: "json",
		}),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Ollama chat failed: ${res.status} ${body}`);
	}

	const data = await res.json();
	const content =
		typeof data === "object" &&
		data !== null &&
		"message" in data &&
		typeof data.message === "object" &&
		data.message !== null &&
		"content" in data.message
			? data.message.content
			: null;
	if (typeof content !== "string") {
		throw new Error("Ollama chat returned no content");
	}
	const parsed = JSON.parse(content);
	console.log(`[Ollama:${model}] response:`, parsed);
	return parsed;
}

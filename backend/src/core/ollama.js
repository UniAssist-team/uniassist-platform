import { clamp01 } from "./util.js";

const MAX_TEXT_CHARS = 24000;

/**
 * @param {string} fileText
 * @param {import("./file-processor").Discount[]} possibleDiscounts
 * @returns {Promise<import("./file-processor").DiscountMatch[]>}
 */
export async function inferDiscountsOllama(fileText, possibleDiscounts) {
	return inferDiscountsCombined(fileText, possibleDiscounts);
}

/**
 * 
 * @param {string} fileText 
 * @param {import("./file-processor").Discount[]} possibleDiscounts 
 * @returns 
 */
async function inferDiscountsCombined(fileText, possibleDiscounts) {
	const trimmed = fileText.slice(0, MAX_TEXT_CHARS);

	// SYSTEM holds the rules + the discounts catalogue (the stable parts of the
	// prompt, byte-identical across requests as long as discounts don't change).
	// USER holds only the per-document text. This layout maximises Ollama
	// KV-cache prefix reuse — moving the catalogue back into USER would
	// invalidate the cache on every request. See plan: prompt-prefix caching.
	const systemContent =
		"You analyse student support documents and decide which discounts they evidence.\n\n" +
		"Reply ONLY with JSON of shape " +
		'{"summary": {"documentType": string, "keywords": string[], "facts": object}, ' +
		'"matches": [{"discountId": string, "confidence": number, "reason": string}]}.\n\n' +
		"summary.documentType is a short label (e.g. 'transcript', 'application form').\n" +
		"summary.keywords are 3-10 short eligibility-relevant phrases.\n" +
		"summary.facts is a flat object of concrete claims (gpa, income, citizenship, disability code, etc.).\n\n" +
		"Matching rules:\n" +
		"- Use general world knowledge to bridge document facts to discount eligibility. " +
		"Example: a person with citizenship of a non-EU country supports an 'International Student' discount, even if the document is not literally a visa.\n" +
		"- A discount's `requiredDocuments` field lists the IDEAL supporting evidence. A different document type can still be PARTIAL evidence if its content is relevant; reflect this in confidence rather than excluding the match.\n" +
		"- Confidence calibration:\n" +
		"  * 0.8-1.0 : the document explicitly proves eligibility (e.g. a transcript with a top-10% GPA for 'Academic Excellence').\n" +
		"  * 0.4-0.7 : the document contains facts that support eligibility but a follow-up document or inference is needed.\n" +
		"  * 0.1-0.3 : weak/speculative — still worth surfacing for a human reviewer.\n" +
		"- Prefer surfacing a low-confidence match over returning an empty list. A human reviewer triages.\n" +
		"- discountId MUST be one of the provided ids in the AVAILABLE DISCOUNTS list below. reason is one short sentence citing the specific fact(s) from the document.\n\n" +
		"AVAILABLE DISCOUNTS (stable order; order does not convey priority):\n" +
		serializeDiscountsStable(possibleDiscounts);

	const result = await chatJson([
		{ role: "system", content: systemContent },
		{ role: "user", content: trimmed },
	]);

	const validIds = new Set(possibleDiscounts.map((d) => d.id));
	const raw =
		typeof result === "object" &&
		result !== null &&
		"matches" in result &&
		Array.isArray(result.matches)
			? result.matches
			: [];
	return normalizeMatches(raw, validIds);
}

/**
 * Stable, deterministic serialisation of the discount catalogue. Sorts by id
 * and emits each discount with a fixed key order so the resulting string is
 * byte-identical across requests (a prerequisite for Ollama prefix caching).
 *
 * @param {import("./file-processor").Discount[]} discounts
 * @returns {string}
 */
function serializeDiscountsStable(discounts) {
	const sorted = [...discounts].sort((a, b) => a.id.localeCompare(b.id));
	const stable = sorted.map((d) => ({
		id: d.id,
		name: d.name,
		description: d.description,
		requiredDocuments: d.requiredDocuments,
	}));
	return JSON.stringify(stable, null, 2);
}

/**
 * @param {any[]} raw
 * @param {Set<string>} validIds
 * @returns {import("./file-processor").DiscountMatch[]}
 */
function normalizeMatches(raw, validIds) {
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

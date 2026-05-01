import { clamp01 } from "./util.js";

/**
 * Curated keyword groups per seeded discount. Order doesn't matter, matches are case-insensitive
 * and use word boundaries so multi-word phrases work.
 */
const KEYWORDS_BY_NAME = /** @type {Record<string, string[]>} */ ({
	"Academic Excellence": [
		"gpa",
		"grade point average",
		"transcript",
		"honors",
		"dean's list",
		"distinction",
		"top of class",
		"academic record",
		"semester",
	],
	"Sports Achievement": [
		"athlete",
		"sports club",
		"federation",
		"championship",
		"tournament",
		"national team",
		"league",
		"coach",
	],
	"Disability / Special Needs": [
		"disability",
		"disabled",
		"wheelchair",
		"blind",
		"deaf",
		"impairment",
		"disability card",
		"special needs",
	],
	"Financial Hardship": [
		"income",
		"tax return",
		"low income",
		"household income",
		"poverty",
		"social services",
		"hardship",
		"minimum wage",
	],
	"Single-Parent Household": [
		"single parent",
		"sole guardian",
		"custody",
		"dependent child",
		"single mother",
		"single father",
	],
	"Orphan / Guardian Status": [
		"orphan",
		"deceased",
		"death certificate",
		"guardian",
		"guardianship",
	],
	"Chronic Illness": [
		"chronic",
		"long-term",
		"diagnosis",
		"medical specialist",
		"treatment plan",
		"condition",
	],
	"First-Generation Student": [
		"first generation",
		"parental education",
		"no university degree",
		"first in family",
	],
	"International Student": [
		"visa",
		"non-eu",
		"passport",
		"international student",
		"residence permit",
		"study permit",
	],
	"Caregiver Status": [
		"caregiver",
		"caretaker",
		"elderly",
		"primary caregiver",
		"dependent relative",
	],
	"Military / Veteran": [
		"military",
		"veteran",
		"armed forces",
		"discharge",
		"reserve",
		"active duty",
	],
});

const STOPWORDS = new Set([
	"the",
	"a",
	"an",
	"or",
	"and",
	"of",
	"in",
	"on",
	"for",
	"to",
	"with",
	"by",
	"is",
	"are",
	"be",
	"as",
	"at",
	"from",
	"that",
	"this",
	"it",
	"its",
	"into",
	"than",
	"documents",
	"document",
	"letter",
	"certificate",
	"form",
	"official",
	"confirmation",
	"statement",
]);

/**
 * Naive keyword-matching classifier. Used as fallback when the LLM is unavailable.
 * For each discount, counts unique curated keyword hits in the document; falls back to
 * keywords auto-derived from description + requiredDocuments for any non-curated discount.
 *
 * @param {string} fileText
 * @param {import("./file-processor").Discount[]} possibleDiscounts
 * @returns {import("./file-processor").DiscountMatch[]}
 */
export function inferDiscountsNaive(fileText, possibleDiscounts) {
	const haystack = fileText.toLowerCase();
	/** @type {import("./file-processor").DiscountMatch[]} */
	const matches = [];

	for (const discount of possibleDiscounts) {
		const keywords =
			KEYWORDS_BY_NAME[discount.name] ?? deriveKeywords(discount);
		if (keywords.length === 0) continue;

		const hits = keywords.filter((kw) => containsWord(haystack, kw));
		const minHits = Math.min(2, keywords.length);
		if (hits.length < minHits) continue;

		matches.push({
			discountId: discount.id,
			confidence: clamp01(hits.length / keywords.length),
			reason: `Matched: ${hits.slice(0, 5).join(", ")}`,
		});
	}

	matches.sort((a, b) => b.confidence - a.confidence);
	return matches;
}

/**
 * @param {import("./file-processor").Discount} discount
 * @returns {string[]}
 */
function deriveKeywords(discount) {
	const text =
		`${discount.description} ${discount.requiredDocuments}`.toLowerCase();
	const tokens = text.match(/[a-z][a-z\-']+/g) ?? [];
	/** @type {string[]} */
	const keywords = [];
	const seen = new Set();
	for (const t of tokens) {
		if (t.length < 4 || STOPWORDS.has(t) || seen.has(t)) continue;
		seen.add(t);
		keywords.push(t);
	}
	return keywords;
}

/**
 * @param {string} haystack - already lowercased
 * @param {string} keyword
 * @returns {boolean}
 */
function containsWord(haystack, keyword) {
	const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { inferDiscounts } from "../src/core/file-processor.js";
import { inferDiscountsNaive } from "../src/core/naive-infer.js";

const SEEDED = [
	{
		id: "d-academic",
		name: "Academic Excellence",
		description: "GPA in top 10% of cohort",
		requiredDocuments: "Official transcript or grade report",
	},
	{
		id: "d-disability",
		name: "Disability / Special Needs",
		description: "Registered physical, cognitive, or sensory disability",
		requiredDocuments: "Medical certificate, disability card",
	},
	{
		id: "d-financial",
		name: "Financial Hardship",
		description: "Household income below national threshold",
		requiredDocuments: "Income declaration, tax return (PIT)",
	},
	{
		id: "d-international",
		name: "International Student",
		description: "Non-EU student enrolled full-time",
		requiredDocuments: "Valid student visa, enrollment confirmation",
	},
];

describe("inferDiscountsNaive", () => {
	it("matches an academic transcript to Academic Excellence", () => {
		const text = "OFFICIAL TRANSCRIPT — Spring Semester. GPA 9.4 — Dean's List.";
		const matches = inferDiscountsNaive(text, SEEDED);
		const academic = matches.find((m) => m.discountId === "d-academic");
		expect(academic).toBeDefined();
		expect(academic?.confidence).toBeGreaterThan(0);
		expect(academic?.reason).toMatch(/transcript|gpa|semester|dean/i);
	});

	it("matches a tax return to Financial Hardship", () => {
		const text = "Tax return for fiscal year 2025. Household income: 12000 EUR.";
		const matches = inferDiscountsNaive(text, SEEDED);
		expect(matches.find((m) => m.discountId === "d-financial")).toBeDefined();
	});

	it("matches a passport to International Student", () => {
		const text = "Passport. Student visa issued. Residence permit number 42.";
		const matches = inferDiscountsNaive(text, SEEDED);
		expect(matches.find((m) => m.discountId === "d-international")).toBeDefined();
	});

	it("returns empty for unrelated content", () => {
		const text = "The weather today is mild and partly cloudy.";
		expect(inferDiscountsNaive(text, SEEDED)).toEqual([]);
	});

	it("filters out single-keyword noise", () => {
		// "income" alone should NOT trigger Financial Hardship (needs >=2 hits)
		const text = "Mention of income in passing, otherwise unrelated text.";
		const matches = inferDiscountsNaive(text, SEEDED);
		expect(matches.find((m) => m.discountId === "d-financial")).toBeUndefined();
	});

	it("clamps confidence to [0, 1] and sorts by confidence desc", () => {
		const text =
			"Disability card issued. Wheelchair user. Sensory disability registered. " +
			"Also includes the words transcript and semester.";
		const matches = inferDiscountsNaive(text, SEEDED);
		expect(matches.length).toBeGreaterThan(0);
		for (const m of matches) {
			expect(m.confidence).toBeGreaterThanOrEqual(0);
			expect(m.confidence).toBeLessThanOrEqual(1);
		}
		for (let i = 1; i < matches.length; i++) {
			expect(matches[i - 1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
		}
	});

	it("auto-derives keywords for a non-curated discount", () => {
		const custom = [
			{
				id: "d-custom",
				name: "Made-Up Discount",
				description: "Eligible if you own a sailboat",
				requiredDocuments: "Sailboat registration",
			},
		];
		const text = "This is the sailboat registration document for vessel 'Eligible'.";
		const matches = inferDiscountsNaive(text, custom);
		expect(matches.find((m) => m.discountId === "d-custom")).toBeDefined();
	});
});

describe("inferDiscounts (dispatcher)", () => {
	const originalKey = process.env.OLLAMA_API_KEY;
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		delete process.env.OLLAMA_API_KEY;
	});

	afterEach(() => {
		if (originalKey === undefined) delete process.env.OLLAMA_API_KEY;
		else process.env.OLLAMA_API_KEY = originalKey;
		globalThis.fetch = originalFetch;
	});

	it("uses the naive classifier when OLLAMA_API_KEY is unset", async () => {
		const text = "Official transcript. GPA: 9.4. Spring semester.";
		const matches = await inferDiscounts(text, SEEDED);
		expect(matches.find((m) => m.discountId === "d-academic")).toBeDefined();
	});

	it("falls back to naive when Ollama errors", async () => {
		process.env.OLLAMA_API_KEY = "fake-key";
		globalThis.fetch = vi.fn(async () => {
			throw new Error("network down");
		});
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const text = "Official transcript. GPA: 9.4. Spring semester.";
		const matches = await inferDiscounts(text, SEEDED);

		expect(matches.find((m) => m.discountId === "d-academic")).toBeDefined();
		expect(errSpy).toHaveBeenCalled();
		errSpy.mockRestore();
	});
});

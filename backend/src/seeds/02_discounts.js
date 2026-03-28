import { randomUUID } from "crypto";

/**
 * @param {import("knex").Knex} knex
 */
export async function seed(knex) {
	const discountsExist = await knex("discounts").first();
	if (discountsExist) return;

	const discounts = [
		{ name: "Academic Excellence", description: "GPA in top 10% of cohort", required_documents: "Official transcript or grade report", benefits: "Tuition reduction, bookstore credit" },
		{ name: "Sports Achievement", description: "Active university or national-level athlete", required_documents: "Sports club letter or federation certificate", benefits: "Gym access, transport subsidy" },
		{ name: "Disability / Special Needs", description: "Registered physical, cognitive, or sensory disability", required_documents: "Medical certificate, disability card", benefits: "Tuition reduction, canteen discount, accommodation priority" },
		{ name: "Financial Hardship", description: "Household income below national threshold", required_documents: "Income declaration, tax return (PIT), social services letter", benefits: "Tuition waiver, meal and transport subsidies" },
		{ name: "Single-Parent Household", description: "Sole guardian of a dependent child", required_documents: "Birth certificate, custody documents, income statement", benefits: "Tuition reduction, childcare support" },
		{ name: "Orphan / Guardian Status", description: "Lost one or both parents", required_documents: "Death certificate(s), guardianship letter", benefits: "Full or partial tuition waiver" },
		{ name: "Chronic Illness", description: "Documented long-term medical condition", required_documents: "Specialist medical certificate (renewed annually)", benefits: "Canteen discount, flexible scheduling" },
		{ name: "First-Generation Student", description: "Neither parent holds a university degree", required_documents: "Self-declaration form, parental education statement", benefits: "Orientation support stipend" },
		{ name: "International Student", description: "Non-EU student enrolled full-time", required_documents: "Valid student visa, enrollment confirmation", benefits: "Language support services, housing priority" },
		{ name: "Caregiver Status", description: "Primary caregiver of an ill or elderly family member", required_documents: "Medical certificate of dependent, caregiver declaration", benefits: "Flexible study plan, canteen discount" },
		{ name: "Military / Veteran", description: "Active reserve member or veteran", required_documents: "Military ID or discharge papers", benefits: "Transport subsidy, priority administrative services" },
	];
	await knex("discounts").insert(discounts.map((d) => ({ id: randomUUID(), ...d })));
	console.log("Discounts seeded");
}

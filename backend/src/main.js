import { serve, setup } from "swagger-ui-express";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import { randomUUID } from "crypto";
import db from "./db.js";
import { hashPassword } from "./crypto.js";
import app from "./app.js";

const swaggerDocument = /** @type {import("swagger-ui-express").JsonObject} */ (load(readFileSync("./openapi.yaml", "utf8")));

app.use("/docs", serve, setup(swaggerDocument));

const port = process.env.PORT || 3001;

async function start() {
	await db.migrate.latest();
	console.log("Migrations applied");

	const rootExists = await db("users").where({ role: "root" }).first();
	if (!rootExists) {
		await db("users").insert({
			id: randomUUID(),
			email: "admin@example.com",
			password_hash: await hashPassword("admin"),
			role: "root",
		});
		console.log("Root admin seeded (admin@example.com / admin)");
	}

	const discountsExist = await db("discounts").first();
	if (!discountsExist) {
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
		await db("discounts").insert(discounts.map((d) => ({ id: randomUUID(), ...d })));
		console.log("Discounts seeded");
	}

	app.listen(port, () => {
		console.log(`Listening on :${port}`);
	});
}

start().catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});

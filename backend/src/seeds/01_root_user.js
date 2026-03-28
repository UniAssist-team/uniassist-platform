import { randomUUID } from "crypto";
import { hashPassword } from "../crypto.js";

/**
 * @param {import("knex").Knex} knex
 */
export async function seed(knex) {
	const adminExists = await knex("users").where({ role: "admin" }).first();
	if (adminExists) return;

	const email = process.env.ADMIN_EMAIL || "admin@example.com";
	const password = process.env.ADMIN_PASSWORD || "admin";

	await knex("users").insert({
		id: randomUUID(),
		email,
		password_hash: await hashPassword(password),
		role: "admin",
	});
	console.log(`Admin seeded (${email})`);
}

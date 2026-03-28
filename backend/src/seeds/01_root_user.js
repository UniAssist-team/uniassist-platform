import { randomUUID } from "crypto";
import { hashPassword } from "../crypto.js";

/**
 * @param {import("knex").Knex} knex
 */
export async function seed(knex) {
	const adminExists = await knex("users").where({ role: "admin" }).first();
	if (adminExists) return;

	await knex("users").insert({
		id: randomUUID(),
		email: "admin@example.com",
		password_hash: await hashPassword("admin"),
		role: "admin",
	});
	console.log("Admin seeded (admin@example.com / admin)");
}

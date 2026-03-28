import { randomUUID } from "crypto";
import { hashPassword } from "../crypto.js";

/**
 * @param {import("knex").Knex} knex
 */
export async function seed(knex) {
	const studentExists = await knex("users")
		.where({ email: "student@example.com" })
		.first();
	if (!studentExists) {
		await knex("users").insert({
			id: randomUUID(),
			email: "student@example.com",
			password_hash: await hashPassword("password123"),
			name: "Student Example",
			role: "student",
		});
		console.log("Student seeded (student@example.com / password123)");
	}

	const staffExists = await knex("users")
		.where({ email: "staff@example.com" })
		.first();
	if (!staffExists) {
		await knex("users").insert({
			id: randomUUID(),
			email: "staff@example.com",
			password_hash: await hashPassword("password123"),
			name: "Staff Example",
			role: "staff",
		});
		console.log("Staff seeded (staff@example.com / password123)");
	}
}

import { randomUUID } from "crypto";
import { hashPassword } from "../crypto.js";

/**
 * @param {import("knex").Knex} knex
 */
export async function seed(knex) {
	const studentExists = await knex("users").where({ role: "student", email: "student@example.com" }).first();
	if (studentExists) return;

	await knex("users").insert({
		id: randomUUID(),
		email: "student@example.com",
		password_hash: await hashPassword("password123"),
        name: "Student Example",
		role: "student",
	});
	console.log("Student seeded (student@example.com / student)");

	await knex("users").insert({
		id: randomUUID(),
		email: "staff@example.com",
		password_hash: await hashPassword("password123"),
        name: "Staff Example",
		role: "staff",
	});
	console.log("Staff seeded (staff@example.com / staff)");
}

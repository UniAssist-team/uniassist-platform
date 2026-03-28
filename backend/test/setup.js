import { randomUUID } from "crypto";
import db from "../src/db.js";
import { hashPassword, generateToken } from "../src/crypto.js";

const TOKEN_TTL_DAYS = 7;

export async function setupDb() {
	await db.migrate.latest();

	// Seed discounts
	const discounts = [
		{ id: randomUUID(), name: "Academic Excellence", description: "GPA in top 10%", required_documents: "Transcript", benefits: "Tuition reduction" },
		{ id: randomUUID(), name: "Financial Hardship", description: "Low income", required_documents: "Income declaration", benefits: "Tuition waiver" },
	];
	await db("discounts").insert(discounts);

	return { discounts };
}

export async function teardownDb() {
	// Drop all rows in reverse dependency order
	await db("application_documents").del();
	await db("applications").del();
	await db("sessions").del();
	await db("documents").del();
	await db("discounts").del();
	await db("users").del();
}

export async function destroyDb() {
	await db.destroy();
}

export async function createUser({ email = "test@example.com", password = "password123", role = "student" } = {}) {
	const id = randomUUID();
	const password_hash = await hashPassword(password);
	await db("users").insert({ id, email, password_hash, role });
	return { id, email, password, role };
}

export async function createSession(userId) {
	const token = generateToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);

	await db("sessions").insert({
		id: randomUUID(),
		user_id: userId,
		token,
		expires_at: expiresAt.toISOString(),
	});

	return token;
}

export async function createExpiredSession(userId) {
	const token = generateToken();

	await db("sessions").insert({
		id: randomUUID(),
		user_id: userId,
		token,
		expires_at: "2020-01-01T00:00:00.000Z",
	});

	return token;
}

export async function createDocument(userId, filename = "test.pdf") {
	const id = randomUUID();
	await db("documents").insert({
		id,
		user_id: userId,
		filename,
		storage_path: `uploads/${id}`,
	});
	return { id, filename };
}

export { db };

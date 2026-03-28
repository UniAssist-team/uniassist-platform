import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupDb, destroyDb, createUser, createSession, createDocument, db } from "./setup.js";

let discounts;

beforeAll(async () => {
	const seed = await setupDb();
	discounts = seed.discounts;
});

beforeEach(async () => {
	await db("application_documents").del();
	await db("applications").del();
	await db("sessions").del();
	await db("documents").del();
	await db("users").del();
});

afterAll(async () => {
	await destroyDb();
});

describe("POST /applications", () => {
	it("creates an application with valid discount and documents", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		const doc = await createDocument(user.id);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(201);
		expect(res.body.discountId).toBe(discounts[0].id);
		expect(res.body.status).toBe("pending");
	});

	it("returns 400 for invalid discount ID", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		const doc = await createDocument(user.id);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: "nonexistent", documentIds: [doc.id] });

		expect(res.status).toBe(400);
	});

	it("returns 400 when no documents provided", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [] });

		expect(res.status).toBe(400);
	});

	it("returns 400 when document belongs to another user", async () => {
		const user1 = await createUser({ email: "u1@example.com" });
		const user2 = await createUser({ email: "u2@example.com" });
		const token = await createSession(user1.id);
		const doc = await createDocument(user2.id);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(400);
	});
});

describe("GET /applications", () => {
	it("lists only the user's applications", async () => {
		const user1 = await createUser({ email: "u1@example.com" });
		const user2 = await createUser({ email: "u2@example.com" });
		const token = await createSession(user1.id);

		const doc1 = await createDocument(user1.id);
		const doc2 = await createDocument(user2.id, "other.pdf");

		// Create application for user1
		await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc1.id] });

		// Create application for user2
		const token2 = await createSession(user2.id);
		await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token2}`)
			.send({ discountId: discounts[1].id, documentIds: [doc2.id] });

		const res = await request(app)
			.get("/applications")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
	});
});

describe("GET /applications/:id", () => {
	it("returns application details with documents", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		const doc = await createDocument(user.id);

		const createRes = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		const res = await request(app)
			.get(`/applications/${createRes.body.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.documents).toHaveLength(1);
		expect(res.body.discountName).toBe(discounts[0].name);
	});

	it("returns 404 for another user's application", async () => {
		const user1 = await createUser({ email: "u1@example.com" });
		const user2 = await createUser({ email: "u2@example.com" });
		const token1 = await createSession(user1.id);
		const token2 = await createSession(user2.id);
		const doc = await createDocument(user1.id);

		const createRes = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token1}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		const res = await request(app)
			.get(`/applications/${createRes.body.id}`)
			.set("Authorization", `Bearer ${token2}`);

		expect(res.status).toBe(404);
	});
});

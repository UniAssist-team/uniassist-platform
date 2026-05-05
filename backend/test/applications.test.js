import { randomUUID } from "crypto";
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

describe("POST /applications auto-assignment", () => {
	it("assigns to the staff member with the fewest pending applications", async () => {
		const student = await createUser({ email: "s@example.com" });
		const staffA = await createUser({ email: "a@example.com", role: "staff" });
		const staffB = await createUser({ email: "b@example.com", role: "staff" });
		const token = await createSession(student.id);
		const doc = await createDocument(student.id);

		await db("applications").insert([
			{
				id: randomUUID(),
				user_id: student.id,
				discount_id: discounts[0].id,
				status: "pending",
				reviewed_by: staffA.id,
			},
			{
				id: randomUUID(),
				user_id: student.id,
				discount_id: discounts[0].id,
				status: "pending",
				reviewed_by: staffA.id,
			},
		]);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(201);
		const created = await db("applications").where({ id: res.body.id }).first();
		expect(created.reviewed_by).toBe(staffB.id);
	});

	it("breaks ties by users.created_at when load is equal", async () => {
		const student = await createUser({ email: "s@example.com" });
		const token = await createSession(student.id);
		const doc = await createDocument(student.id);

		const staffAId = randomUUID();
		const staffBId = randomUUID();
		await db("users").insert([
			{
				id: staffAId,
				email: "a@example.com",
				password_hash: "x",
				role: "staff",
				created_at: "2024-01-01T00:00:00.000Z",
			},
			{
				id: staffBId,
				email: "b@example.com",
				password_hash: "x",
				role: "staff",
				created_at: "2024-06-01T00:00:00.000Z",
			},
		]);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(201);
		const created = await db("applications").where({ id: res.body.id }).first();
		expect(created.reviewed_by).toBe(staffAId);
	});

	it("does not count approved or rejected applications toward load", async () => {
		const student = await createUser({ email: "s@example.com" });
		const staffA = await createUser({ email: "a@example.com", role: "staff" });
		const staffB = await createUser({ email: "b@example.com", role: "staff" });
		const token = await createSession(student.id);
		const doc = await createDocument(student.id);

		const approvedRows = Array.from({ length: 5 }, () => ({
			id: randomUUID(),
			user_id: student.id,
			discount_id: discounts[0].id,
			status: "approved",
			reviewed_by: staffA.id,
		}));
		await db("applications").insert([
			...approvedRows,
			{
				id: randomUUID(),
				user_id: student.id,
				discount_id: discounts[0].id,
				status: "pending",
				reviewed_by: staffB.id,
			},
		]);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(201);
		const created = await db("applications").where({ id: res.body.id }).first();
		expect(created.reviewed_by).toBe(staffA.id);
	});

	it("leaves reviewed_by null when no staff users exist", async () => {
		const student = await createUser({ email: "s@example.com" });
		const token = await createSession(student.id);
		const doc = await createDocument(student.id);

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${token}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(201);
		const created = await db("applications").where({ id: res.body.id }).first();
		expect(created.reviewed_by).toBeNull();
	});

	it("PATCH from a different staff overrides the auto-assigned reviewer", async () => {
		const student = await createUser({ email: "s@example.com" });
		const staffA = await createUser({ email: "a@example.com", role: "staff" });
		const staffB = await createUser({ email: "b@example.com", role: "staff" });
		const studentToken = await createSession(student.id);
		const staffBToken = await createSession(staffB.id);
		const doc = await createDocument(student.id);

		await db("applications").insert({
			id: randomUUID(),
			user_id: student.id,
			discount_id: discounts[0].id,
			status: "pending",
			reviewed_by: staffB.id,
		});

		const res = await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${studentToken}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		expect(res.status).toBe(201);
		const created = await db("applications").where({ id: res.body.id }).first();
		expect(created.reviewed_by).toBe(staffA.id);

		const patchRes = await request(app)
			.patch(`/admin/applications/${res.body.id}`)
			.set("Authorization", `Bearer ${staffBToken}`)
			.send({ status: "approved" });
		expect(patchRes.status).toBe(200);

		const updated = await db("applications").where({ id: res.body.id }).first();
		expect(updated.reviewed_by).toBe(staffB.id);
		expect(updated.status).toBe("approved");
	});
});

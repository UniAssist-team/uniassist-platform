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

async function createApplicationForUser(user, token, discountId) {
	const doc = await createDocument(user.id);
	const res = await request(app)
		.post("/applications")
		.set("Authorization", `Bearer ${token}`)
		.send({ discountId, documentIds: [doc.id] });
	return res.body;
}

describe("GET /admin/applications", () => {
	it("returns all applications as admin", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "root" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		await createApplicationForUser(student, studentToken, discounts[0].id);

		const res = await request(app)
			.get("/admin/applications")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.body[0]).toHaveProperty("userEmail");
	});

	it("returns 403 as student", async () => {
		const student = await createUser();
		const token = await createSession(student.id);

		const res = await request(app)
			.get("/admin/applications")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(403);
	});

	it("filters by status", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "root" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const application = await createApplicationForUser(student, studentToken, discounts[0].id);

		// Approve the application
		await request(app)
			.patch(`/admin/applications/${application.id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "approved" });

		// Filter for pending — should be empty
		const res = await request(app)
			.get("/admin/applications?status=pending")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(0);

		// Filter for approved — should find it
		const res2 = await request(app)
			.get("/admin/applications?status=approved")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res2.status).toBe(200);
		expect(res2.body).toHaveLength(1);
	});
});

describe("PATCH /admin/applications/:id", () => {
	it("approves an application", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "root" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const application = await createApplicationForUser(student, studentToken, discounts[0].id);

		const res = await request(app)
			.patch(`/admin/applications/${application.id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "approved" });

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("approved");
		expect(res.body.reviewedBy).toBe(admin.id);
	});

	it("rejects with a review note", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "root" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const application = await createApplicationForUser(student, studentToken, discounts[0].id);

		const res = await request(app)
			.patch(`/admin/applications/${application.id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "rejected", reviewNote: "Missing documents" });

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("rejected");
		expect(res.body.reviewNote).toBe("Missing documents");
	});

	it("returns 400 for invalid status", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "root" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const application = await createApplicationForUser(student, studentToken, discounts[0].id);

		const res = await request(app)
			.patch(`/admin/applications/${application.id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "invalid" });

		expect(res.status).toBe(400);
	});

	it("returns 404 for non-existent application", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "root" });
		const adminToken = await createSession(admin.id);

		const res = await request(app)
			.patch("/admin/applications/nonexistent-id")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "approved" });

		expect(res.status).toBe(404);
	});

	it("returns 403 as student", async () => {
		const student = await createUser();
		const token = await createSession(student.id);

		const res = await request(app)
			.patch("/admin/applications/some-id")
			.set("Authorization", `Bearer ${token}`)
			.send({ status: "approved" });

		expect(res.status).toBe(403);
	});
});

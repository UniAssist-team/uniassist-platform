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
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
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

	it("returns only assigned applications as staff by default", async () => {
		const staffA = await createUser({ email: "a@example.com", role: "staff" });
		const staffB = await createUser({ email: "b@example.com", role: "staff" });
		const student = await createUser({ email: "student@example.com" });
		const staffAToken = await createSession(staffA.id);
		const studentToken = await createSession(student.id);

		const created = await createApplicationForUser(
			student,
			studentToken,
			discounts[0].id,
		);
		// Force the application to be assigned to staffB so staffA shouldn't see it
		await db("applications")
			.where({ id: created.id })
			.update({ reviewed_by: staffB.id });

		const res = await request(app)
			.get("/admin/applications")
			.set("Authorization", `Bearer ${staffAToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(0);
		expect(res.headers["x-total-count"]).toBe("0");
	});

	it("returns all applications as staff with assignedTo=all", async () => {
		const staffA = await createUser({ email: "a@example.com", role: "staff" });
		const staffB = await createUser({ email: "b@example.com", role: "staff" });
		const student = await createUser({ email: "student@example.com" });
		const staffAToken = await createSession(staffA.id);
		const studentToken = await createSession(student.id);

		const created = await createApplicationForUser(
			student,
			studentToken,
			discounts[0].id,
		);
		await db("applications")
			.where({ id: created.id })
			.update({ reviewed_by: staffB.id });

		const res = await request(app)
			.get("/admin/applications?assignedTo=all")
			.set("Authorization", `Bearer ${staffAToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.body[0].reviewedBy).toBe(staffB.id);
	});

	it("admin sees all applications regardless of assignedTo", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const created = await createApplicationForUser(
			student,
			studentToken,
			discounts[0].id,
		);
		await db("applications")
			.where({ id: created.id })
			.update({ reviewed_by: staff.id });

		const res = await request(app)
			.get("/admin/applications")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
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
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const application = await createApplicationForUser(student, studentToken, discounts[0].id);

		// Approve the application
		await request(app)
			.patch(`/admin/applications/${application.id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "approved" });

		// Filter for pending - should be empty
		const res = await request(app)
			.get("/admin/applications?status=pending")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(0);

		// Filter for approved - should find it
		const res2 = await request(app)
			.get("/admin/applications?status=approved")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res2.status).toBe(200);
		expect(res2.body).toHaveLength(1);
	});

	it("returns pagination headers with defaults", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		await createApplicationForUser(student, studentToken, discounts[0].id);
		await createApplicationForUser(student, studentToken, discounts[1].id);

		const res = await request(app)
			.get("/admin/applications")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(2);
		expect(res.headers["x-total-count"]).toBe("2");
		expect(res.headers["x-page"]).toBe("1");
		expect(res.headers["x-per-page"]).toBe("20");
		expect(res.headers["x-total-pages"]).toBe("1");
	});

	it("paginates results", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		await createApplicationForUser(student, studentToken, discounts[0].id);
		await createApplicationForUser(student, studentToken, discounts[1].id);

		const page1 = await request(app)
			.get("/admin/applications?page=1&perPage=1")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(page1.status).toBe(200);
		expect(page1.body).toHaveLength(1);
		expect(page1.headers["x-total-count"]).toBe("2");
		expect(page1.headers["x-total-pages"]).toBe("2");

		const page2 = await request(app)
			.get("/admin/applications?page=2&perPage=1")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(page2.status).toBe(200);
		expect(page2.body).toHaveLength(1);
		expect(page2.body[0].id).not.toBe(page1.body[0].id);
	});

	it("returns empty array for page beyond total", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const adminToken = await createSession(admin.id);

		const res = await request(app)
			.get("/admin/applications?page=99")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(0);
		expect(res.headers["x-total-count"]).toBe("0");
		expect(res.headers["x-total-pages"]).toBe("0");
	});

	it("pagination works with status filter", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const app1 = await createApplicationForUser(student, studentToken, discounts[0].id);
		await createApplicationForUser(student, studentToken, discounts[1].id);

		await request(app)
			.patch(`/admin/applications/${app1.id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ status: "approved" });

		const res = await request(app)
			.get("/admin/applications?status=approved&page=1&perPage=10")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.headers["x-total-count"]).toBe("1");
		expect(res.headers["x-total-pages"]).toBe("1");
	});
});

describe("PATCH /admin/applications/:id", () => {
	it("approves an application", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
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

	it("approves an application as staff", async () => {
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const student = await createUser({ email: "student@example.com" });
		const staffToken = await createSession(staff.id);
		const studentToken = await createSession(student.id);

		const application = await createApplicationForUser(student, studentToken, discounts[0].id);

		const res = await request(app)
			.patch(`/admin/applications/${application.id}`)
			.set("Authorization", `Bearer ${staffToken}`)
			.send({ status: "approved" });

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("approved");
		expect(res.body.reviewedBy).toBe(staff.id);
	});

	it("rejects with a review note", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
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
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
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
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
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

describe("POST /admin/users", () => {
	it("creates a staff account as admin", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.post("/admin/users")
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Staff User", email: "staff@example.com", password: "pass123", role: "staff" });

		expect(res.status).toBe(201);
		expect(res.body.email).toBe("staff@example.com");
		expect(res.body.name).toBe("Staff User");
		expect(res.body.role).toBe("staff");
		expect(res.body).toHaveProperty("id");
		expect(res.body).not.toHaveProperty("password");
	});

	it("creates a student account as admin", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.post("/admin/users")
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "student@example.com", password: "pass123", role: "student" });

		expect(res.status).toBe(201);
		expect(res.body.role).toBe("student");
		expect(res.body.name).toBeNull();
	});

	it("returns 409 for duplicate email", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		await createUser({ email: "taken@example.com" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.post("/admin/users")
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "taken@example.com", password: "pass123", role: "staff" });

		expect(res.status).toBe(409);
	});

	it("returns 400 for role 'admin'", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.post("/admin/users")
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "evil@example.com", password: "pass123", role: "admin" });

		expect(res.status).toBe(400);
	});

	it("returns 403 as staff", async () => {
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const token = await createSession(staff.id);

		const res = await request(app)
			.post("/admin/users")
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "new@example.com", password: "pass123", role: "staff" });

		expect(res.status).toBe(403);
	});

	it("returns 403 as student", async () => {
		const student = await createUser();
		const token = await createSession(student.id);

		const res = await request(app)
			.post("/admin/users")
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "new@example.com", password: "pass123", role: "staff" });

		expect(res.status).toBe(403);
	});

	it("returns 401 without auth", async () => {
		const res = await request(app)
			.post("/admin/users")
			.send({ email: "new@example.com", password: "pass123", role: "staff" });

		expect(res.status).toBe(401);
	});
});

describe("GET /admin/users", () => {
	it("returns all users as admin", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		await createUser({ email: "student1@example.com" });
		await createUser({ email: "student2@example.com" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.get("/admin/users")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(3);
		expect(res.body[0]).toHaveProperty("id");
		expect(res.body[0]).toHaveProperty("email");
		expect(res.body[0]).toHaveProperty("role");
		expect(res.body[0]).toHaveProperty("createdAt");
	});

	it("returns 403 as staff", async () => {
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const token = await createSession(staff.id);

		const res = await request(app)
			.get("/admin/users")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(403);
	});

	it("returns 403 as student", async () => {
		const student = await createUser();
		const token = await createSession(student.id);

		const res = await request(app)
			.get("/admin/users")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(403);
	});

	it("returns 401 without auth", async () => {
		const res = await request(app).get("/admin/users");

		expect(res.status).toBe(401);
	});

	it("returns pagination headers with defaults", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		await createUser({ email: "s1@example.com" });
		await createUser({ email: "s2@example.com" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.get("/admin/users")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(3);
		expect(res.headers["x-total-count"]).toBe("3");
		expect(res.headers["x-page"]).toBe("1");
		expect(res.headers["x-per-page"]).toBe("20");
		expect(res.headers["x-total-pages"]).toBe("1");
	});

	it("paginates results", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		await createUser({ email: "s1@example.com" });
		await createUser({ email: "s2@example.com" });
		const token = await createSession(admin.id);

		const page1 = await request(app)
			.get("/admin/users?page=1&perPage=2")
			.set("Authorization", `Bearer ${token}`);

		expect(page1.status).toBe(200);
		expect(page1.body).toHaveLength(2);
		expect(page1.headers["x-total-count"]).toBe("3");
		expect(page1.headers["x-total-pages"]).toBe("2");

		const page2 = await request(app)
			.get("/admin/users?page=2&perPage=2")
			.set("Authorization", `Bearer ${token}`);

		expect(page2.status).toBe(200);
		expect(page2.body).toHaveLength(1);
	});

	it("returns empty array for page beyond total", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.get("/admin/users?page=99")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(0);
		expect(res.headers["x-total-count"]).toBe("1");
		expect(res.headers["x-total-pages"]).toBe("1");
	});
});

describe("PATCH /admin/users/:id", () => {
	it("promotes student to staff", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.patch(`/admin/users/${student.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "staff" });

		expect(res.status).toBe(200);
		expect(res.body.role).toBe("staff");
		expect(res.body.email).toBe("student@example.com");
	});

	it("demotes staff to student", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.patch(`/admin/users/${staff.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "student" });

		expect(res.status).toBe(200);
		expect(res.body.role).toBe("student");
	});

	it("returns 403 when changing admin's role", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.patch(`/admin/users/${admin.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "student" });

		expect(res.status).toBe(403);
		expect(res.body.message).toBe("Cannot change the admin user's role");
	});

	it("returns 400 for role 'admin'", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.patch(`/admin/users/${student.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "admin" });

		expect(res.status).toBe(400);
	});

	it("returns 404 for non-existent user", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.patch("/admin/users/nonexistent-id")
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "staff" });

		expect(res.status).toBe(404);
	});

	it("returns 403 as staff", async () => {
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const student = await createUser({ email: "student@example.com" });
		const token = await createSession(staff.id);

		const res = await request(app)
			.patch(`/admin/users/${student.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "staff" });

		expect(res.status).toBe(403);
	});

	it("returns 403 as student", async () => {
		const student = await createUser({ email: "student@example.com" });
		const other = await createUser({ email: "other@example.com" });
		const token = await createSession(student.id);

		const res = await request(app)
			.patch(`/admin/users/${other.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "staff" });

		expect(res.status).toBe(403);
	});
});

describe("DELETE /admin/users/:id", () => {
	it("deletes a student", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.delete(`/admin/users/${student.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(204);

		const deleted = await db("users").where({ id: student.id }).first();
		expect(deleted).toBeUndefined();
	});

	it("returns 403 when deleting admin", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.delete(`/admin/users/${admin.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(403);
		expect(res.body.message).toBe("Cannot delete the admin user");
	});

	it("returns 404 for non-existent user", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const token = await createSession(admin.id);

		const res = await request(app)
			.delete("/admin/users/nonexistent-id")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});

	it("returns 403 as staff", async () => {
		const staff = await createUser({ email: "staff@example.com", role: "staff" });
		const student = await createUser({ email: "student@example.com" });
		const token = await createSession(staff.id);

		const res = await request(app)
			.delete(`/admin/users/${student.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(403);
	});

	it("returns 403 as student", async () => {
		const student = await createUser({ email: "student@example.com" });
		const other = await createUser({ email: "other@example.com" });
		const token = await createSession(student.id);

		const res = await request(app)
			.delete(`/admin/users/${other.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(403);
	});

	it("cascades to related data", async () => {
		const admin = await createUser({ email: "admin@example.com", role: "admin" });
		const student = await createUser({ email: "student@example.com" });
		const adminToken = await createSession(admin.id);
		const studentToken = await createSession(student.id);

		const doc = await createDocument(student.id);
		await request(app)
			.post("/applications")
			.set("Authorization", `Bearer ${studentToken}`)
			.send({ discountId: discounts[0].id, documentIds: [doc.id] });

		await request(app)
			.delete(`/admin/users/${student.id}`)
			.set("Authorization", `Bearer ${adminToken}`);

		const docs = await db("documents").where({ user_id: student.id });
		const apps = await db("applications").where({ user_id: student.id });
		expect(docs).toHaveLength(0);
		expect(apps).toHaveLength(0);
	});
});

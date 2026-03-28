import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs/promises";
import app from "../src/app.js";
import { setupDb, teardownDb, destroyDb, createUser, createSession, createDocument, db } from "./setup.js";

beforeAll(async () => {
	await setupDb();
	await fs.mkdir("uploads", { recursive: true });
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

describe("POST /documents/upload", () => {
	it("uploads a file", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("test content"), "test.pdf");

		expect(res.status).toBe(201);
		expect(res.body.id).toBeDefined();
		expect(res.body.filename).toBe("test.pdf");
		expect(res.body.uploadedAt).toBeDefined();
	});

	it("returns 415 without multipart content type", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(415);
	});

	it("returns 401 without auth", async () => {
		const res = await request(app)
			.post("/documents/upload")
			.attach("file", Buffer.from("test"), "test.pdf");

		expect(res.status).toBe(401);
	});
});

describe("GET /documents", () => {
	it("lists only the user's documents", async () => {
		const user1 = await createUser({ email: "u1@example.com" });
		const user2 = await createUser({ email: "u2@example.com" });
		const token = await createSession(user1.id);

		await createDocument(user1.id, "mine.pdf");
		await createDocument(user2.id, "theirs.pdf");

		const res = await request(app)
			.get("/documents")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.body[0].filename).toBe("mine.pdf");
	});
});

describe("GET /documents/:documentId/file", () => {
	it("downloads own document", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		// Create a real file for download
		const doc = await createDocument(user.id, "download.txt");
		await fs.writeFile(doc.id, "file content");
		await db("documents").where({ id: doc.id }).update({ storage_path: doc.id });

		const res = await request(app)
			.get(`/documents/${doc.id}/file`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);

		// Clean up
		await fs.unlink(doc.id).catch(() => {});
	});

	it("returns 404 for another user's document", async () => {
		const user1 = await createUser({ email: "u1@example.com" });
		const user2 = await createUser({ email: "u2@example.com" });
		const token = await createSession(user1.id);

		const doc = await createDocument(user2.id, "secret.pdf");

		const res = await request(app)
			.get(`/documents/${doc.id}/file`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});

	it("returns 404 for non-existent document", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.get("/documents/nonexistent-id/file")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});

describe("DELETE /documents/:documentId", () => {
	it("deletes own document", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		const doc = await createDocument(user.id, "delete-me.pdf");

		const res = await request(app)
			.delete(`/documents/${doc.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(204);

		// Verify it's gone
		const check = await db("documents").where({ id: doc.id }).first();
		expect(check).toBeUndefined();
	});

	it("returns 404 for another user's document", async () => {
		const user1 = await createUser({ email: "u1@example.com" });
		const user2 = await createUser({ email: "u2@example.com" });
		const token = await createSession(user1.id);
		const doc = await createDocument(user2.id, "not-mine.pdf");

		const res = await request(app)
			.delete(`/documents/${doc.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs/promises";

vi.mock("../src/core/file-processor.js", () => ({
	ensurePdf: vi.fn(async () => {}),
	extractTextFromPdf: vi.fn(async () => ""),
	inferDiscounts: vi.fn(async () => []),
}));

vi.mock("../src/core/ocr.js", () => ({
	extractTextFromPdfImages: vi.fn(async () => ({ text: "", pageCount: 0 })),
	OCR_FALLBACK_TEXT_LIMIT: 200,
	prewarmOcr: vi.fn(async () => {}),
	terminateOcrWorkers: vi.fn(async () => {}),
}));

const fileProcessor = await import("../src/core/file-processor.js");
const ocr = await import("../src/core/ocr.js");
const app = (await import("../src/app.js")).default;
const { setupDb, teardownDb, destroyDb, createUser, createSession, createDocument, db } = await import("./setup.js");

beforeAll(async () => {
	await setupDb();
	await fs.mkdir("uploads", { recursive: true });
});

afterEach(async () => {
	const docs = await db("documents").select("storage_path");
	await Promise.all(
		docs.map((d) => fs.unlink(d.storage_path).catch(() => {})),
	);
});

beforeEach(async () => {
	await db("application_documents").del();
	await db("applications").del();
	await db("sessions").del();
	await db("documents").del();
	await db("users").del();
	vi.mocked(fileProcessor.ensurePdf).mockReset().mockResolvedValue(undefined);
	vi.mocked(fileProcessor.extractTextFromPdf).mockReset().mockResolvedValue("");
	vi.mocked(fileProcessor.inferDiscounts).mockReset().mockResolvedValue([]);
	vi.mocked(ocr.extractTextFromPdfImages)
		.mockReset()
		.mockResolvedValue({ text: "", pageCount: 0 });
});

afterAll(async () => {
	await destroyDb();
});

describe("POST /documents/upload", () => {
	it("uploads a file", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		vi.mocked(fileProcessor.inferDiscounts).mockResolvedValue([
			{ discountId: "d1", confidence: 0.9, reason: "GPA 9.4" },
		]);

		const res = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("test content"), "test.pdf");

		expect(res.status).toBe(201);
		expect(res.body.id).toBeDefined();
		expect(res.body.filename).toBe("test.pdf");
		expect(res.body.uploadedAt).toBeDefined();
		expect(res.body.matches).toEqual([
			{ discountId: "d1", confidence: 0.9, reason: "GPA 9.4" },
		]);
	});

	it("runs OCR fallback when text-layer is sparse", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		vi.mocked(fileProcessor.extractTextFromPdf).mockResolvedValue("short");
		vi.mocked(ocr.extractTextFromPdfImages).mockResolvedValue({
			text: "OCR EXTRACTED TEXT",
			pageCount: 1,
		});

		const res = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("test content"), "scan.pdf");

		expect(res.status).toBe(201);
		expect(ocr.extractTextFromPdfImages).toHaveBeenCalledOnce();
		const passedText = vi.mocked(fileProcessor.inferDiscounts).mock.calls[0]?.[0];
		expect(passedText).toContain("short");
		expect(passedText).toContain("OCR EXTRACTED TEXT");
	});

	it("skips OCR fallback when text-layer is plentiful", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		const longText = "a".repeat(500);
		vi.mocked(fileProcessor.extractTextFromPdf).mockResolvedValue(longText);

		const res = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("test content"), "text.pdf");

		expect(res.status).toBe(201);
		expect(ocr.extractTextFromPdfImages).not.toHaveBeenCalled();
	});

	it("rejects re-upload of the same file by the same user with 409", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		const content = Buffer.from("identical content");

		const first = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", content, "first.pdf");
		expect(first.status).toBe(201);

		const second = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", content, "second.pdf");
		expect(second.status).toBe(409);
		expect(second.body.message).toBe("You have already uploaded this file");

		const docs = await db("documents").where({ user_id: user.id });
		expect(docs).toHaveLength(1);
	});

	it("allows two different users to upload the same file content", async () => {
		const userA = await createUser({ email: "a@example.com" });
		const userB = await createUser({ email: "b@example.com" });
		const tokenA = await createSession(userA.id);
		const tokenB = await createSession(userB.id);
		const content = Buffer.from("shared content");

		const a = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${tokenA}`)
			.attach("file", content, "a.pdf");
		expect(a.status).toBe(201);

		const b = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${tokenB}`)
			.attach("file", content, "b.pdf");
		expect(b.status).toBe(201);
	});

	it("rejects non-PDF files with 400", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		vi.mocked(fileProcessor.ensurePdf).mockRejectedValue(new Error("File is not a PDF"));

		const res = await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("not a pdf"), "fake.pdf");

		expect(res.status).toBe(400);
		expect(res.body.message).toBe("File is not a PDF");
		const docs = await db("documents").select("*");
		expect(docs).toHaveLength(0);
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

describe("matches persistence", () => {
	it("persists matches on upload and returns them in the list", async () => {
		const user = await createUser();
		const token = await createSession(user.id);
		vi.mocked(fileProcessor.inferDiscounts).mockResolvedValue([
			{ discountId: "d-academic", confidence: 0.8, reason: "GPA" },
		]);

		await request(app)
			.post("/documents/upload")
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("persistence content"), "doc.pdf");

		const list = await request(app)
			.get("/documents")
			.set("Authorization", `Bearer ${token}`);
		expect(list.status).toBe(200);
		expect(list.body).toHaveLength(1);
		expect(list.body[0].matches).toEqual([
			{ discountId: "d-academic", confidence: 0.8, reason: "GPA" },
		]);
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

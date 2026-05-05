import { createHash, randomUUID } from "crypto";
import path from "path";
import { Router } from "express";
import fs from "fs/promises";
import db from "../db.js";
import { requireAuth } from "../middleware.js";
import { toISO } from "../format.js";
import {
	ensurePdf,
	extractTextFromPdf,
	inferDiscounts,
} from "../core/file-processor.js";
import {
	extractTextFromPdfImages,
	OCR_FALLBACK_TEXT_LIMIT,
} from "../core/ocr.js";

const router = Router();

router.get("/documents", requireAuth, async (req, res) => {
	const docs = await db("documents")
		.where({ user_id: req.user.id })
		.select("id", "filename", "uploaded_at as uploadedAt", "matches");
	res.json(
		docs.map((d) => ({
			...d,
			uploadedAt: toISO(d.uploadedAt),
			matches: JSON.parse(d.matches),
		})),
	);
});

router.get("/documents/:documentId/file", requireAuth, async (req, res) => {
	const doc = await db("documents")
		.where({ id: String(req.params.documentId), user_id: req.user.id })
		.first();

	if (!doc) return res.sendStatus(404);

	return res.download(path.resolve(doc.storage_path), doc.filename);
});

router.post("/documents/upload", requireAuth, async (req, res) => {
	const t0 = performance.now();
	const file = /** @type {Express.Multer.File | undefined} */ (
		Array.isArray(req.files) ? req.files[0] : req.file
	);
	if (!file) {
		return res.status(400).json({ message: "No file provided" });
	}

	try {
		await ensurePdf(file.path);
	} catch {
		await fs.unlink(file.path).catch(() => {});
		return res.status(400).json({ message: "File is not a PDF" });
	}

	const buffer = await fs.readFile(file.path);
	const checksum = createHash("sha256").update(buffer).digest("hex");
	const storagePath = path.join("uploads", `${req.user.id}-${checksum}`);

	const existing = await db("documents")
		.where({ user_id: req.user.id, storage_path: storagePath })
		.first();
	if (existing) {
		await fs.unlink(file.path).catch(() => {});
		return res.status(409).json({
			message: "You have already uploaded this file",
		});
	}

	await fs.rename(file.path, storagePath);

	const tExtractStart = performance.now();
	const [extractedText, discounts] = await Promise.all([
		extractTextFromPdf(storagePath),
		db("discounts").select(
			"id",
			"name",
			"description",
			"required_documents as requiredDocuments",
		),
	]);
	const extractMs = Math.round(performance.now() - tExtractStart);

	let text = extractedText;
	let ocrMs = 0;
	let pageCount = 0;
	if (text.trim().length < OCR_FALLBACK_TEXT_LIMIT) {
		const tOcrStart = performance.now();
		const ocrResult = await extractTextFromPdfImages(storagePath);
		ocrMs = Math.round(performance.now() - tOcrStart);
		pageCount = ocrResult.pageCount;
		text = ocrResult.text ? `${text}\n\n${ocrResult.text}` : text;
	}

	const tLlmStart = performance.now();
	const matches = await inferDiscounts(text, discounts);
	const llmMs = Math.round(performance.now() - tLlmStart);

	const id = randomUUID();
	const tInsertStart = performance.now();
	await db("documents").insert({
		id,
		user_id: req.user.id,
		filename: file.originalname,
		storage_path: storagePath,
		matches: JSON.stringify(matches),
	});

	const doc = await db("documents").where({ id }).first();
	const insertMs = Math.round(performance.now() - tInsertStart);
	if (!doc) return res.sendStatus(500);

	const totalMs = Math.round(performance.now() - t0);
	console.log(
		`[upload] doc=${id} bytes=${file.size} pages=${pageCount} extract=${extractMs}ms ocr=${ocrMs}ms llm=${llmMs}ms dbInsert=${insertMs}ms total=${totalMs}ms`,
	);

	return res.status(201).json({
		id: doc.id,
		filename: doc.filename,
		uploadedAt: toISO(doc.uploaded_at),
		matches,
	});
});

router.delete("/documents/:documentId", requireAuth, async (req, res) => {
	const doc = await db("documents")
		.where({ id: String(req.params.documentId), user_id: req.user.id })
		.first();

	if (!doc) return res.sendStatus(404);

	await fs.unlink(doc.storage_path).catch(() => {});
	await db("documents").where({ id: doc.id }).del();

	return res.sendStatus(204);
});

export default router;

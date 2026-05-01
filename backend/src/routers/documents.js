import { randomUUID } from "crypto";
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
		.select("id", "filename", "uploaded_at as uploadedAt");
	res.json(docs.map((d) => ({ ...d, uploadedAt: toISO(d.uploadedAt) })));
});

router.get("/documents/:documentId/file", requireAuth, async (req, res) => {
	const doc = await db("documents")
		.where({ id: String(req.params.documentId), user_id: req.user.id })
		.first();

	if (!doc) return res.sendStatus(404);

	return res.download(path.resolve(doc.storage_path), doc.filename);
});

router.post("/documents/upload", requireAuth, async (req, res) => {
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

	const id = randomUUID();
	await db("documents").insert({
		id,
		user_id: req.user.id,
		filename: file.originalname,
		storage_path: file.path,
	});

	const doc = await db("documents").where({ id }).first();
	if (!doc) return res.sendStatus(500);

	let text = await extractTextFromPdf(file.path);
	if (text.trim().length < OCR_FALLBACK_TEXT_LIMIT) {
		const ocrText = await extractTextFromPdfImages(file.path);
		text = ocrText ? `${text}\n\n${ocrText}` : text;
	}
	const discounts = await db("discounts").select(
		"id",
		"name",
		"description",
		"required_documents as requiredDocuments",
	);
	const matches = await inferDiscounts(text, discounts);

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

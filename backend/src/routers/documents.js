import { randomUUID } from "crypto";
import path from "path";
import { Router } from "express";
// TODO: replace multer with S3-compatible storage (MinIO)
import multer from "multer";
import fs from "fs/promises";
import db from "../db.js";
import { requireAuth } from "../middleware.js";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.get("/documents", requireAuth, async (req, res) => {
	const docs = await db("documents")
		.where({ user_id: req.user.id })
		.select("id", "filename", "uploaded_at as uploadedAt");
	res.json(docs);
});

router.get("/documents/:documentId/file", requireAuth, async (req, res) => {
	const doc = await db("documents")
		.where({ id: req.params.documentId, user_id: req.user.id })
		.first();

	if (!doc) return res.sendStatus(404);

	res.download(path.resolve(doc.storage_path), doc.filename);
});

router.post(
	"/documents/upload",
	requireAuth,
	upload.single("file"),
	async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: "No file provided" });
		}

		const id = randomUUID();
		await db("documents").insert({
			id,
			user_id: req.user.id,
			filename: req.file.originalname,
			storage_path: req.file.path,
		});

		const doc = await db("documents").where({ id }).first();

		res.status(201).json({
			id: doc.id,
			filename: doc.filename,
			uploadedAt: doc.uploaded_at,
		});
	},
);

router.delete("/documents/:documentId", requireAuth, async (req, res) => {
	const doc = await db("documents")
		.where({ id: req.params.documentId, user_id: req.user.id })
		.first();

	if (!doc) return res.sendStatus(404);

	await fs.unlink(doc.storage_path).catch(() => {});
	await db("documents").where({ id: doc.id }).del();

	res.sendStatus(204);
});

export default router;

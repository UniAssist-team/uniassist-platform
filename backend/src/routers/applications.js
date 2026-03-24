import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/applications", requireAuth, async (req, res) => {
	const applications = await db("applications")
		.where({ user_id: req.user.id })
		.join("discounts", "applications.discount_id", "discounts.id")
		.select(
			"applications.id",
			"applications.status",
			"applications.review_note as reviewNote",
			"applications.created_at as createdAt",
			"applications.updated_at as updatedAt",
			"discounts.id as discountId",
			"discounts.name as discountName",
		);

	res.json(applications);
});

router.get("/applications/:id", requireAuth, async (req, res) => {
	const application = await db("applications")
		.where({ "applications.id": req.params.id, "applications.user_id": req.user.id })
		.join("discounts", "applications.discount_id", "discounts.id")
		.select(
			"applications.id",
			"applications.status",
			"applications.review_note as reviewNote",
			"applications.created_at as createdAt",
			"applications.updated_at as updatedAt",
			"discounts.id as discountId",
			"discounts.name as discountName",
			"discounts.description as discountDescription",
			"discounts.benefits",
		)
		.first();

	if (!application) return res.sendStatus(404);

	const documents = await db("application_documents")
		.where({ application_id: application.id })
		.join("documents", "application_documents.document_id", "documents.id")
		.select("documents.id", "documents.filename", "documents.uploaded_at as uploadedAt");

	res.json({ ...application, documents });
});

router.post("/applications", requireAuth, async (req, res) => {
	const { discountId, documentIds } = req.body;

	const discount = await db("discounts").where({ id: discountId }).first();
	if (!discount) return res.status(400).json({ message: "Discount not found" });

	if (!documentIds || !documentIds.length) {
		return res.status(400).json({ message: "At least one document is required" });
	}

	const docs = await db("documents")
		.whereIn("id", documentIds)
		.andWhere({ user_id: req.user.id });
	if (docs.length !== documentIds.length) {
		return res.status(400).json({ message: "One or more documents not found" });
	}

	const id = randomUUID();
	await db("applications").insert({
		id,
		user_id: req.user.id,
		discount_id: discountId,
	});

	await db("application_documents").insert(
		documentIds.map((documentId) => ({
			application_id: id,
			document_id: documentId,
		})),
	);

	const application = await db("applications").where({ id }).first();

	res.status(201).json({
		id: application.id,
		discountId: application.discount_id,
		status: application.status,
		createdAt: application.created_at,
	});
});

export default router;

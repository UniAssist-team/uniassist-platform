import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware.js";

const router = Router();

router.get("/admin/applications", requireAuth, requireRole("admin", "root"), async (req, res) => {
	const query = db("applications")
		.join("discounts", "applications.discount_id", "discounts.id")
		.join("users", "applications.user_id", "users.id")
		.select(
			"applications.id",
			"applications.status",
			"applications.review_note as reviewNote",
			"applications.created_at as createdAt",
			"applications.updated_at as updatedAt",
			"discounts.id as discountId",
			"discounts.name as discountName",
			"users.id as userId",
			"users.email as userEmail",
		);

	if (req.query.status) {
		query.where("applications.status", req.query.status);
	}

	const applications = await query;
	res.json(applications);
});

router.patch("/admin/applications/:id", requireAuth, requireRole("admin", "root"), async (req, res) => {
	const { status, reviewNote } = req.body;

	if (!["approved", "rejected"].includes(status)) {
		return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
	}

	const application = await db("applications").where({ id: req.params.id }).first();
	if (!application) return res.sendStatus(404);

	await db("applications").where({ id: req.params.id }).update({
		status,
		review_note: reviewNote || null,
		reviewed_by: req.user.id,
		updated_at: new Date().toISOString(),
	});

	const updated = await db("applications").where({ id: req.params.id }).first();

	res.json({
		id: updated.id,
		status: updated.status,
		reviewNote: updated.review_note,
		reviewedBy: updated.reviewed_by,
		updatedAt: updated.updated_at,
	});
});

export default router;

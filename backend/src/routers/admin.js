import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../db.js";
import { hashPassword } from "../crypto.js";
import { requireAuth, requireRole } from "../middleware.js";
import { toISO } from "../format.js";

const router = Router();

router.get("/admin/applications", requireAuth, requireRole("staff", "admin"), async (req, res) => {
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
	res.json(applications.map((a) => ({ ...a, createdAt: toISO(a.createdAt), updatedAt: toISO(a.updatedAt) })));
});

router.patch("/admin/applications/:id", requireAuth, requireRole("staff", "admin"), async (req, res) => {
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
		updatedAt: toISO(updated.updated_at),
	});
});

router.post("/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
	const { name, email, password, role } = req.body;

	const existing = await db("users").where({ email }).first();
	if (existing) {
		return res.sendStatus(409);
	}

	const id = randomUUID();
	const password_hash = await hashPassword(password);

	await db("users").insert({ id, name, email, password_hash, role });

	res.status(201).json({ id, name: name || null, email, role });
});

router.get("/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
	const users = await db("users").select("id", "name", "email", "role", "created_at as createdAt");
	res.json(users.map((u) => ({ ...u, createdAt: toISO(u.createdAt) })));
});

router.patch("/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
	const { role } = req.body;

	const user = await db("users").where({ id: req.params.id }).first();
	if (!user) return res.sendStatus(404);

	if (user.role === "admin") {
		return res.status(403).json({ message: "Cannot change the admin user's role" });
	}

	await db("users").where({ id: req.params.id }).update({ role });

	res.json({ id: user.id, name: user.name || null, email: user.email, role });
});

router.delete("/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
	const user = await db("users").where({ id: req.params.id }).first();
	if (!user) return res.sendStatus(404);

	if (user.role === "admin") {
		return res.status(403).json({ message: "Cannot delete the admin user" });
	}

	await db("users").where({ id: req.params.id }).del();

	res.sendStatus(204);
});

export default router;

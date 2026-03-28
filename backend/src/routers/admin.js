import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../db.js";
import { hashPassword } from "../crypto.js";
import { requireAuth, requireRole } from "../middleware.js";
import { toISO } from "../format.js";

const router = Router();

/** @param {import('express').Request['query']} query */
function parsePagination(query) {
	const page = Math.max(1, parseInt(/** @type {string} */ (query.page)) || 1);
	const perPage = Math.max(1, Math.min(100, parseInt(/** @type {string} */ (query.perPage)) || 20));
	return { page, perPage, offset: (page - 1) * perPage };
}

/**
 * @param {import('express').Response} res
 * @param {{ page: number, perPage: number, totalCount: number }} opts
 */
function setPaginationHeaders(res, { page, perPage, totalCount }) {
	res.set("X-Total-Count", String(totalCount));
	res.set("X-Page", String(page));
	res.set("X-Per-Page", String(perPage));
	res.set("X-Total-Pages", String(Math.ceil(totalCount / perPage)));
}

router.get(
	"/admin/applications",
	requireAuth,
	requireRole("staff", "admin"),
	async (req, res) => {
		const { page, perPage, offset } = parsePagination(req.query);

		const baseQuery = db("applications")
			.join("discounts", "applications.discount_id", "discounts.id")
			.join("users", "applications.user_id", "users.id");

		if (req.query.status) {
			baseQuery.where("applications.status", req.query.status);
		}

		const [{ count: totalCount }] = await baseQuery.clone().count("applications.id as count");

		const applications = await baseQuery
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
			)
			.limit(perPage)
			.offset(offset);

		setPaginationHeaders(res, { page, perPage, totalCount: Number(totalCount) });
		res.json(
			applications.map((a) => ({
				...a,
				createdAt: toISO(a.createdAt),
				updatedAt: toISO(a.updatedAt),
			})),
		);
	},
);

router.patch(
	"/admin/applications/:id",
	requireAuth,
	requireRole("staff", "admin"),
	async (req, res) => {
		const { status, reviewNote } = req.body;

		if (!["approved", "rejected"].includes(status)) {
			return res
				.status(400)
				.json({ message: "Status must be 'approved' or 'rejected'" });
		}

		const application = await db("applications")
			.where({ id: req.params.id })
			.first();
		if (!application) return res.sendStatus(404);

		await db("applications")
			.where({ id: req.params.id })
			.update({
				status,
				review_note: reviewNote || null,
				reviewed_by: req.user.id,
				updated_at: new Date().toISOString(),
			});

		const updated = await db("applications")
			.where({ id: req.params.id })
			.first();

		res.json({
			id: updated.id,
			status: updated.status,
			reviewNote: updated.review_note,
			reviewedBy: updated.reviewed_by,
			updatedAt: toISO(updated.updated_at),
		});
	},
);

router.post(
	"/admin/users",
	requireAuth,
	requireRole("admin"),
	async (req, res) => {
		const { name, email, password, role } = req.body;

		const existing = await db("users").where({ email }).first();
		if (existing) {
			return res.sendStatus(409);
		}

		const id = randomUUID();
		const passwordHash = await hashPassword(password);

		await db("users").insert({
			id,
			name,
			email,
			password_hash: passwordHash,
			role,
		});

		res.status(201).json({ id, name: name || null, email, role });
	},
);

router.get(
	"/admin/users",
	requireAuth,
	requireRole("admin"),
	async (req, res) => {
		const { page, perPage, offset } = parsePagination(req.query);

		const [{ count: totalCount }] = await db("users").count("id as count");

		const users = await db("users")
			.select("id", "name", "email", "role", "created_at as createdAt")
			.limit(perPage)
			.offset(offset);

		setPaginationHeaders(res, { page, perPage, totalCount: Number(totalCount) });
		res.json(users.map((u) => ({ ...u, createdAt: toISO(u.createdAt) })));
	},
);

router.patch(
	"/admin/users/:id",
	requireAuth,
	requireRole("admin"),
	async (req, res) => {
		const { role } = req.body;

		const user = await db("users").where({ id: req.params.id }).first();
		if (!user) return res.sendStatus(404);

		if (user.role === "admin") {
			return res
				.status(403)
				.json({ message: "Cannot change the admin user's role" });
		}

		await db("users").where({ id: req.params.id }).update({ role });

		res.json({ id: user.id, name: user.name || null, email: user.email, role });
	},
);

router.delete(
	"/admin/users/:id",
	requireAuth,
	requireRole("admin"),
	async (req, res) => {
		const user = await db("users").where({ id: req.params.id }).first();
		if (!user) return res.sendStatus(404);

		if (user.role === "admin") {
			return res.status(403).json({ message: "Cannot delete the admin user" });
		}

		await db("users").where({ id: req.params.id }).del();

		res.sendStatus(204);
	},
);

export default router;

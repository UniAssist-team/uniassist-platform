import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware.js";
import { hashPassword, verifyPassword, generateToken } from "../crypto.js";

const router = Router();

const TOKEN_TTL_DAYS = 7;

router.get("/session", requireAuth, (req, res) => {
	res.json(req.user);
});

router.post("/session/register", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.sendStatus(400);
	}

	const existing = await db("users").where({ email }).first();
	if (existing) {
		return res.sendStatus(409);
	}

	const id = randomUUID();
	const passwordHash = await hashPassword(password);

	await db("users").insert({
		id,
		email,
		password_hash: passwordHash,
		role: "student",
	});

	const token = generateToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);

	await db("sessions").insert({
		id: randomUUID(),
		user_id: id,
		token,
		expires_at: expiresAt.toISOString(),
	});

	return res.status(201).json({
		token,
		user: { id, email, role: "student" },
	});
});

router.post("/session/login", async (req, res) => {
	const { email, password } = req.body;

	const user = await db("users").where({ email }).first();
	if (!user || !(await verifyPassword(password, user.password_hash))) {
		return res.sendStatus(401);
	}

	const token = generateToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);

	await db("sessions").insert({
		id: randomUUID(),
		user_id: user.id,
		token,
		expires_at: expiresAt.toISOString(),
	});

	return res.json({
		token,
		user: { id: user.id, email: user.email, role: user.role },
	});
});

router.post("/session/logout", requireAuth, async (req, res) => {
	const token = /** @type {string} */ (req.headers.authorization).slice(7);
	await db("sessions").where({ token }).del();
	res.sendStatus(204);
});

export default router;

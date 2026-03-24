import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware.js";
import { verifyPassword, generateToken } from "../crypto.js";

const router = Router();

const TOKEN_TTL_DAYS = 7;

router.get("/session", requireAuth, (req, res) => {
	res.json(req.user);
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

	res.json({
		token,
		user: { id: user.id, email: user.email, role: user.role },
	});
});

router.post("/session/logout", requireAuth, async (req, res) => {
	const token = req.headers.authorization.slice(7);
	await db("sessions").where({ token }).del();
	res.sendStatus(204);
});

export default router;

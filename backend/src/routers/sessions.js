import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../db.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/session", requireAuth, (req, res) => {
	res.json({
		userId: req.session.userId,
		email: req.session.email,
		createdAt: req.session.createdAt,
	});
});

router.post("/session/login", async (req, res) => {
	const { email, password } = req.body;

	const user = await db("users").where({ email }).first();
	if (!user || !(await bcrypt.compare(password, user.password_hash))) {
		return res.sendStatus(401);
	}

	req.session.userId = user.id;
	req.session.email = user.email;
	req.session.createdAt = user.created_at;

	res.json({
		userId: user.id,
		email: user.email,
		createdAt: user.created_at,
	});
});

router.post("/session/logout", (req, res) => {
	if (!req.session.userId) return res.sendStatus(401);

	req.session.destroy((err) => {
		if (err) return res.sendStatus(500);
		res.clearCookie("connect.sid");
		res.sendStatus(204);
	});
});

export default router;

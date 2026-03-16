import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/discounts", async (req, res) => {
	if (!req.session.userId) return res.sendStatus(401);

	const rows = await db("discounts").select("*");

	res.json(
		rows.map((r) => ({
			id: r.id,
			description: r.description,
			amount: Number(r.amount),
			unit: r.unit,
		})),
	);
});

export default router;

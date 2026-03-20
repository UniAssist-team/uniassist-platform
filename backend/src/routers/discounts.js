import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/discounts", requireAuth, async (req, res) => {
	const rows = await db("discounts").select("*");

	res.json(
		rows.map((r) => ({
			id: r.id,
			name: r.name,
			description: r.description,
			requiredDocuments: r.required_documents,
			benefits: r.benefits,
		})),
	);
});

export default router;

import express from "express";
import { serve, setup } from "swagger-ui-express";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import { randomUUID } from "crypto";
import db from "./db.js";
import { hashPassword } from "./crypto.js";
import { requestLogger, errorHandler } from "./middleware.js";
import sessionsRouter from "./routers/sessions.js";
import discountsRouter from "./routers/discounts.js";
import documentsRouter from "./routers/documents.js";

const swaggerDocument = load(readFileSync("./openapi.yaml", "utf8"));

const app = express();

app.use(requestLogger);
app.use(express.json());
app.use("/docs", serve, setup(swaggerDocument));
app.use("/", sessionsRouter);
app.use("/", discountsRouter);
app.use("/", documentsRouter);
app.use(errorHandler);

const port = process.env.PORT || 3001;

async function start() {
	await db.migrate.latest();
	console.log("Migrations applied");

	const rootExists = await db("users").where({ role: "root" }).first();
	if (!rootExists) {
		await db("users").insert({
			id: randomUUID(),
			email: "admin@example.com",
			password_hash: await hashPassword("admin"),
			role: "root",
		});
		console.log("Root admin seeded (admin@example.com / admin)");
	}

	app.listen(port, () => {
		console.log(`Listening on :${port}`);
	});
}

start().catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});

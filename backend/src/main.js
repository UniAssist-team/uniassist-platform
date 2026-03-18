import express from "express";
import { serve, setup } from "swagger-ui-express";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import db from "./db.js";
import { requestLogger } from "./middleware.js";
import sessionsRouter from "./routers/sessions.js";
import discountsRouter from "./routers/discounts.js";
import documentsRouter from "./routers/documents.js";

const swaggerDocument = load(readFileSync("./openapi.yaml", "utf8"));

const app = express();

app.use(requestLogger);
app.use("/docs", serve, setup(swaggerDocument));
app.use("/", sessionsRouter);
app.use("/", discountsRouter);
app.use("/", documentsRouter);

const port = process.env.PORT || 3001;

async function start() {
	await db.migrate.latest();
	console.log("Migrations applied");

	app.listen(port, () => {
		console.log(`Listening on :${port}`);
	});
}

start().catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});

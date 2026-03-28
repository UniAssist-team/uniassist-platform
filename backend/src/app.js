import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";
import { serve, setup } from "swagger-ui-express";
import { load } from "js-yaml";
import { requestLogger, errorHandler } from "./middleware.js";
import sessionsRouter from "./routers/sessions.js";
import discountsRouter from "./routers/discounts.js";
import documentsRouter from "./routers/documents.js";
import applicationsRouter from "./routers/applications.js";
import adminRouter from "./routers/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const swaggerDocument = /** @type {import("swagger-ui-express").JsonObject} */ (
	load(readFileSync(path.join(__dirname, "..", "openapi.yaml"), "utf8"))
);

const allowedOrigins = (process.env.ALLOW_ORIGINS || "http://localhost:3000")
	.split(",")
	.map((o) => o.trim());

const app = express();

app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (origin && allowedOrigins.includes(origin)) {
		res.set("Access-Control-Allow-Origin", origin);
		res.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
		res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
		res.set(
			"Access-Control-Expose-Headers",
			"X-Total-Count,X-Page,X-Per-Page,X-Total-Pages",
		);
	}
	if (req.method === "OPTIONS") return res.sendStatus(204);
	next();
});
app.use(requestLogger);
app.use("/docs", serve, setup(swaggerDocument));
app.use(express.json());
app.use(
	OpenApiValidator.middleware({
		apiSpec: path.join(__dirname, "..", "openapi.yaml"),
		validateRequests: true,
		validateResponses: true,
		fileUploader: { dest: "uploads/" },
	}),
);
app.use("/", sessionsRouter);
app.use("/", discountsRouter);
app.use("/", documentsRouter);
app.use("/", applicationsRouter);
app.use("/", adminRouter);
app.use(errorHandler);

export default app;

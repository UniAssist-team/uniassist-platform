import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";
import { requestLogger, errorHandler } from "./middleware.js";
import sessionsRouter from "./routers/sessions.js";
import discountsRouter from "./routers/discounts.js";
import documentsRouter from "./routers/documents.js";
import applicationsRouter from "./routers/applications.js";
import adminRouter from "./routers/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(requestLogger);
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

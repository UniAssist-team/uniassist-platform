import db from "./db.js";

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').NextFunction} NextFunction */
/** @typedef {"student" | "staff" | "admin"} Role */

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function requestLogger(req, res, next) {
	const start = Date.now();
	const { method, url } = req;

	res.on("finish", () => {
		const ms = Date.now() - start;
		console.log(`${method} ${url} ${res.statusCode} - ${ms}ms`);
	});

	next();
}

/**
 * @param {Error & { status?: number, errors?: unknown[] }} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
	const status = err.status || 500;
	if (status >= 500) {
		console.error(`${req.method} ${req.url} - Unhandled error:\n`, err);
	}
	res.status(status).json({
		message: err.message,
		errors: err.errors,
	});
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function requireAuth(req, res, next) {
	const header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer ")) {
		res.sendStatus(401);
		return;
	}

	const token = header.slice(7);
	const session = await db("sessions")
		.where({ token })
		.where("expires_at", ">", new Date().toISOString())
		.first();

	if (!session) {
		res.sendStatus(401);
		return;
	}

	const user = await db("users").where({ id: session.user_id }).first();
	if (!user) {
		res.sendStatus(401);
		return;
	}

	req.user = { id: user.id, email: user.email, role: user.role };
	next();
}

/**
 * @param {...Role} roles
 */
export function requireRole(...roles) {
	/** @param {Request} req @param {Response} res @param {NextFunction} next */
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			res.sendStatus(403);
			return;
		}
		next();
	};
}

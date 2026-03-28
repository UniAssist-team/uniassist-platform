import db from "./db.js";

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').NextFunction} NextFunction */

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
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
	console.error(`${req.method} ${req.url} - Unhandled error:\n`, err);
	res.sendStatus(500);
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function requireAuth(req, res, next) {
	const header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}

	const token = header.slice(7);
	const session = await db("sessions")
		.where({ token })
		.where("expires_at", ">", new Date().toISOString())
		.first();

	if (!session) {
		return res.sendStatus(401);
	}

	const user = await db("users").where({ id: session.user_id }).first();
	if (!user) {
		return res.sendStatus(401);
	}

	req.user = { id: user.id, email: user.email, role: user.role };
	next();
}

/**
 * @param {...string} roles
 */
export function requireRole(...roles) {
	/** @param {Request} req @param {Response} res @param {NextFunction} next */
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.sendStatus(403);
		}
		next();
	};
}

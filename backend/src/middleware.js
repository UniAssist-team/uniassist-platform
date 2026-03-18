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
export function requireAuth(req, res, next) {
	if (!req.session || !req.session.userId) {
		return res.sendStatus(401);
	}
	next();
}

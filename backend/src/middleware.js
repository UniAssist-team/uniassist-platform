/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').NextFunction} NextFunction */

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function requireAuth(req, res, next) {
	if (!req.session.userId) return res.sendStatus(401);
	next();
}

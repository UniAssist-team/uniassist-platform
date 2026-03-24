import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * @param {string} password
 * @returns {Promise<string>} salt:hash
 */
export async function hashPassword(password) {
	const salt = randomBytes(SALT_LENGTH).toString("hex");
	const hash = await scryptAsync(password, salt, KEY_LENGTH);
	return `${salt}:${hash.toString("hex")}`;
}

/**
 * @param {string} password
 * @param {string} stored - salt:hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
	const [salt, hash] = stored.split(":");
	const hashBuffer = Buffer.from(hash, "hex");
	const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
	return timingSafeEqual(hashBuffer, derivedKey);
}

/**
 * @returns {string} random hex token
 */
export function generateToken() {
	return randomBytes(32).toString("hex");
}

/**
 * Convert a SQLite timestamp (e.g. "2026-03-28 14:32:54") to ISO 8601 format.
 * Already-valid ISO strings pass through unchanged.
 * @param {string} timestamp
 * @returns {string}
 */
export function toISO(timestamp) {
	if (!timestamp) return timestamp;
	if (timestamp.includes("T")) return timestamp;
	return timestamp.replace(" ", "T") + "Z";
}

/**
 * @param {number} n
 * @returns {number}
 */
export function clamp01(n) {
	if (!Number.isFinite(n)) return 0;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

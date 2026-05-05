import db from "../db.js";

/**
 * Returns the id of the staff user (role='staff') with the fewest
 * applications in 'pending' status. Tie-breaks by users.created_at,
 * then users.id. Returns null if no staff users exist.
 *
 * Not race-safe across concurrent inserts: two simultaneous POSTs can
 * read the same snapshot and pick the same staff member.
 *
 * @param {import('knex').Knex} knexInstance
 * @returns {Promise<string | null>}
 */
export async function pickLeastLoadedStaffId(knexInstance = db) {
	const row = await knexInstance("users")
		.leftJoin("applications", function () {
			this.on("applications.reviewed_by", "=", "users.id").andOn(
				"applications.status",
				"=",
				knexInstance.raw("?", ["pending"]),
			);
		})
		.where("users.role", "staff")
		.groupBy("users.id", "users.created_at")
		.select("users.id")
		.count("applications.id as pendingCount")
		.orderBy([
			{ column: "pendingCount", order: "asc" },
			{ column: "users.created_at", order: "asc" },
			{ column: "users.id", order: "asc" },
		])
		.first();
	return row?.id ?? null;
}

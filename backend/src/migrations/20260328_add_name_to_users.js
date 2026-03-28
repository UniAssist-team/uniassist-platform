/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
	return knex.schema.alterTable("users", (t) => {
		t.string("name");
	});
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
	return knex.schema.alterTable("users", (t) => {
		t.dropColumn("name");
	});
}

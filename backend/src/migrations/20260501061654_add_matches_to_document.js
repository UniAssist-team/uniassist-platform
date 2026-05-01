/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
	return knex.schema.alterTable("documents", (t) => {
		t.text("matches").notNullable().defaultTo("[]");
	});
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
	return knex.schema.alterTable("documents", (t) => {
		t.dropColumn("matches");
	});
}

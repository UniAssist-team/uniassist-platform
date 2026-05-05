/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
	return knex.schema.createTable("password_reset_tokens", (t) => {
		t.uuid("id").primary();
		t.uuid("user_id")
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		t.string("token").notNullable().unique();
		t.timestamp("expires_at").notNullable();
		t.timestamp("created_at").defaultTo(knex.fn.now());
	});
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
	return knex.schema.dropTableIfExists("password_reset_tokens");
}

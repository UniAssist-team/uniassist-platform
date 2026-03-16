/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
	return knex.schema
		.createTable("users", (t) => {
			t.uuid("id").primary().defaultTo(knex.fn.uuid());
			t.string("email").notNullable().unique();
			t.string("password_hash").notNullable();
			t.timestamp("created_at").defaultTo(knex.fn.now());
		})
		.createTable("documents", (t) => {
			t.uuid("id").primary().defaultTo(knex.fn.uuid());
			t.uuid("user_id")
				.notNullable()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			t.string("filename").notNullable();
			t.string("storage_path").notNullable();
			t.timestamp("uploaded_at").defaultTo(knex.fn.now());
		})
		.createTable("discounts", (t) => {
			t.uuid("id").primary().defaultTo(knex.fn.uuid());
			t.string("description").notNullable();
			t.decimal("amount", 10, 2).notNullable();
			t.enu("unit", ["percent", "fixed"]).notNullable();
		});
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
	return knex.schema
		.dropTableIfExists("documents")
		.dropTableIfExists("discounts")
		.dropTableIfExists("users");
}

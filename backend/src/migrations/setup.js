/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
	return knex.schema
		.createTable("users", (t) => {
			t.uuid("id").primary();
			t.string("email").notNullable().unique();
			t.string("password_hash").notNullable();
			t.string("role").notNullable().defaultTo("student");
			t.timestamp("created_at").defaultTo(knex.fn.now());
		})
		.createTable("sessions", (t) => {
			t.uuid("id").primary();
			t.uuid("user_id")
				.notNullable()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			t.string("token").notNullable().unique();
			t.timestamp("expires_at").notNullable();
			t.timestamp("created_at").defaultTo(knex.fn.now());
		})
		.createTable("documents", (t) => {
			t.uuid("id").primary();
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
			t.uuid("id").primary();
			t.string("description").notNullable();
			t.decimal("amount", 10, 2).notNullable();
			t.string("unit").notNullable();
		});
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
	return knex.schema
		.dropTableIfExists("sessions")
		.dropTableIfExists("documents")
		.dropTableIfExists("discounts")
		.dropTableIfExists("users");
}

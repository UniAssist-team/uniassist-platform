/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
	return knex.schema
		.createTable("users", (t) => {
			t.uuid("id").primary();
			t.string("name");
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
			t.string("name").notNullable();
			t.string("description").notNullable();
			t.string("required_documents").notNullable();
			t.string("benefits").notNullable();
		})
		.createTable("applications", (t) => {
			t.uuid("id").primary();
			t.uuid("user_id")
				.notNullable()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			t.uuid("discount_id")
				.notNullable()
				.references("id")
				.inTable("discounts")
				.onDelete("CASCADE");
			t.string("status").notNullable().defaultTo("pending");
			t.uuid("reviewed_by").references("id").inTable("users").onDelete("SET NULL");
			t.string("review_note");
			t.timestamp("created_at").defaultTo(knex.fn.now());
			t.timestamp("updated_at").defaultTo(knex.fn.now());
		})
		.createTable("application_documents", (t) => {
			t.uuid("application_id")
				.notNullable()
				.references("id")
				.inTable("applications")
				.onDelete("CASCADE");
			t.uuid("document_id")
				.notNullable()
				.references("id")
				.inTable("documents")
				.onDelete("CASCADE");
			t.primary(["application_id", "document_id"]);
		});
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
	return knex.schema
		.dropTableIfExists("application_documents")
		.dropTableIfExists("applications")
		.dropTableIfExists("sessions")
		.dropTableIfExists("documents")
		.dropTableIfExists("discounts")
		.dropTableIfExists("users");
}

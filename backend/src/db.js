import knex from "knex";

const db = knex({
	client: "better-sqlite3",
	connection: {
		filename: process.env.DATABASE_PATH || "./data.db",
	},
	useNullAsDefault: true,
	migrations: {
		directory: "./src/migrations",
	},
	pool: {
		afterCreate(conn, done) {
			conn.pragma("journal_mode = WAL");
			conn.pragma("foreign_keys = ON");
			done();
		},
	},
});

export default db;

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('knex').Knex.Config} */
const config = {
	client: "better-sqlite3",
	connection: {
		filename: process.env.DATABASE_PATH || "./data.db",
	},
	useNullAsDefault: true,
	migrations: {
		directory: path.join(__dirname, "migrations"),
		stub: path.join(__dirname, "migration.stub"),
	},
	seeds: {
		directory: path.join(__dirname, "seeds"),
	},
	pool: {
		/** @param {import("better-sqlite3").Database} conn @param {(err?: Error | null) => void} done */
		afterCreate(conn, done) {
			conn.pragma("journal_mode = WAL");
			conn.pragma("foreign_keys = ON");
			done();
		},
	},
};

export default config;

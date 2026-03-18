import knex from "knex";

const db = knex({
	client: "pg",
	connection: process.env.DATABASE_URL,
	searchPath: ["knex", "public"],
	migrations: {
		directory: "./src/migrations",
	},
});

export default db;

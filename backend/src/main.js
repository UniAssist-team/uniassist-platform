import db from "./db.js";
import app from "./app.js";

const port = process.env.PORT || 3001;

async function start() {
	await db.migrate.latest();
	console.log("Migrations applied");

	await db.seed.run();

	app.listen(port, () => {
		console.log(`Listening on :${port}`);
	});
}

start().catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});

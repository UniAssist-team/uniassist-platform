import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupDb, teardownDb, destroyDb, createUser, createSession, createExpiredSession, db } from "./setup.js";

beforeAll(async () => {
	await setupDb();
});

beforeEach(async () => {
	await db("sessions").del();
	await db("users").del();
});

afterAll(async () => {
	await destroyDb();
});

describe("POST /session/register", () => {
	it("registers a new student", async () => {
		const res = await request(app)
			.post("/session/register")
			.send({ email: "new@example.com", password: "pass123" });

		expect(res.status).toBe(201);
		expect(res.body.token).toBeDefined();
		expect(res.body.user.email).toBe("new@example.com");
		expect(res.body.user.role).toBe("student");
	});

	it("returns 400 when email is missing", async () => {
		const res = await request(app)
			.post("/session/register")
			.send({ password: "pass123" });

		expect(res.status).toBe(400);
	});

	it("returns 400 when password is missing", async () => {
		const res = await request(app)
			.post("/session/register")
			.send({ email: "new@example.com" });

		expect(res.status).toBe(400);
	});

	it("returns 409 when email already exists", async () => {
		await createUser({ email: "taken@example.com" });

		const res = await request(app)
			.post("/session/register")
			.send({ email: "taken@example.com", password: "pass123" });

		expect(res.status).toBe(409);
	});
});

describe("POST /session/login", () => {
	it("logs in with valid credentials", async () => {
		await createUser({ email: "user@example.com", password: "secret" });

		const res = await request(app)
			.post("/session/login")
			.send({ email: "user@example.com", password: "secret" });

		expect(res.status).toBe(200);
		expect(res.body.token).toBeDefined();
		expect(res.body.user.email).toBe("user@example.com");
	});

	it("returns 401 for wrong password", async () => {
		await createUser({ email: "user@example.com", password: "secret" });

		const res = await request(app)
			.post("/session/login")
			.send({ email: "user@example.com", password: "wrong" });

		expect(res.status).toBe(401);
	});

	it("returns 401 for non-existent email", async () => {
		const res = await request(app)
			.post("/session/login")
			.send({ email: "nobody@example.com", password: "pass" });

		expect(res.status).toBe(401);
	});
});

describe("GET /session", () => {
	it("returns current user with valid token", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.get("/session")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.email).toBe(user.email);
		expect(res.body.role).toBe("student");
	});

	it("returns 401 without token", async () => {
		const res = await request(app).get("/session");
		expect(res.status).toBe(401);
	});

	it("returns 401 with expired token", async () => {
		const user = await createUser();
		const token = await createExpiredSession(user.id);

		const res = await request(app)
			.get("/session")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(401);
	});
});

describe("POST /session/logout", () => {
	it("invalidates the session token", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.post("/session/logout")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(204);

		// Token should no longer work
		const check = await request(app)
			.get("/session")
			.set("Authorization", `Bearer ${token}`);

		expect(check.status).toBe(401);
	});
});

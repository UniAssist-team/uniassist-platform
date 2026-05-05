import { randomUUID } from "crypto";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";

vi.mock("../src/email.js", () => ({
	transport: {},
	sendResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import app from "../src/app.js";
import { sendResetEmail } from "../src/email.js";
import { verifyPassword } from "../src/crypto.js";
import { setupDb, teardownDb, destroyDb, createUser, createSession, createExpiredSession, db } from "./setup.js";

beforeAll(async () => {
	await setupDb();
});

beforeEach(async () => {
	await db("password_reset_tokens").del();
	await db("sessions").del();
	await db("users").del();
	vi.mocked(sendResetEmail).mockClear();
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

describe("POST /session/send-reset", () => {
	it("issues a token and sends an email for a known user", async () => {
		const user = await createUser({ email: "u@example.com" });

		const res = await request(app)
			.post("/session/send-reset")
			.send({ email: user.email });

		expect(res.status).toBe(204);
		expect(sendResetEmail).toHaveBeenCalledTimes(1);
		const [to, token] = vi.mocked(sendResetEmail).mock.calls[0];
		expect(to).toBe(user.email);
		expect(token).toMatch(/^[a-f0-9]{64}$/);

		const row = await db("password_reset_tokens")
			.where({ user_id: user.id })
			.first();
		expect(row).toBeDefined();
		expect(row.token).toBe(token);
	});

	it("returns 204 and does nothing for an unknown email", async () => {
		const res = await request(app)
			.post("/session/send-reset")
			.send({ email: "nobody@example.com" });

		expect(res.status).toBe(204);
		expect(sendResetEmail).not.toHaveBeenCalled();
		const count = await db("password_reset_tokens").count("id as c").first();
		expect(Number(count.c)).toBe(0);
	});

	it("returns 400 when email is missing", async () => {
		const res = await request(app).post("/session/send-reset").send({});
		expect(res.status).toBe(400);
	});
});

describe("POST /session/confirm-reset", () => {
	async function seedToken(userId, { expiresInMs = 60 * 60 * 1000 } = {}) {
		const token = "test-token-" + randomUUID();
		await db("password_reset_tokens").insert({
			id: randomUUID(),
			user_id: userId,
			token,
			expires_at: new Date(Date.now() + expiresInMs).toISOString(),
		});
		return token;
	}

	it("updates the password, consumes the token, and wipes sessions", async () => {
		const user = await createUser({
			email: "u@example.com",
			password: "old-pass",
		});
		const existingSession = await createSession(user.id);
		const token = await seedToken(user.id);

		const res = await request(app)
			.post("/session/confirm-reset")
			.send({ token, password: "new-pass" });

		expect(res.status).toBe(204);

		const updated = await db("users").where({ id: user.id }).first();
		expect(await verifyPassword("new-pass", updated.password_hash)).toBe(true);
		expect(await verifyPassword("old-pass", updated.password_hash)).toBe(false);

		const tokenRow = await db("password_reset_tokens").where({ token }).first();
		expect(tokenRow).toBeUndefined();

		const session = await db("sessions")
			.where({ token: existingSession })
			.first();
		expect(session).toBeUndefined();
	});

	it("returns 401 for an expired token and leaves the password unchanged", async () => {
		const user = await createUser({
			email: "u@example.com",
			password: "old-pass",
		});
		const token = await seedToken(user.id, { expiresInMs: -1000 });

		const res = await request(app)
			.post("/session/confirm-reset")
			.send({ token, password: "new-pass" });

		expect(res.status).toBe(401);

		const updated = await db("users").where({ id: user.id }).first();
		expect(await verifyPassword("old-pass", updated.password_hash)).toBe(true);
	});

	it("returns 401 for an unknown token", async () => {
		const res = await request(app)
			.post("/session/confirm-reset")
			.send({ token: "not-a-real-token", password: "new-pass" });

		expect(res.status).toBe(401);
	});

	it("returns 400 when token or password is missing", async () => {
		const res = await request(app).post("/session/confirm-reset").send({});
		expect(res.status).toBe(400);
	});

	it("end-to-end: new password works, old password is rejected", async () => {
		const user = await createUser({
			email: "u@example.com",
			password: "old-pass",
		});
		const token = await seedToken(user.id);

		await request(app)
			.post("/session/confirm-reset")
			.send({ token, password: "new-pass" });

		const newLogin = await request(app)
			.post("/session/login")
			.send({ email: user.email, password: "new-pass" });
		expect(newLogin.status).toBe(200);
		expect(newLogin.body.token).toBeDefined();

		const oldLogin = await request(app)
			.post("/session/login")
			.send({ email: user.email, password: "old-pass" });
		expect(oldLogin.status).toBe(401);
	});
});

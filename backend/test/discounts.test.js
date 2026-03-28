import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupDb, destroyDb, createUser, createSession, db } from "./setup.js";

beforeAll(async () => {
	await setupDb();
});

afterAll(async () => {
	await destroyDb();
});

describe("GET /discounts", () => {
	it("returns seeded discounts when authenticated", async () => {
		const user = await createUser();
		const token = await createSession(user.id);

		const res = await request(app)
			.get("/discounts")
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.length).toBeGreaterThanOrEqual(2);
		expect(res.body[0]).toHaveProperty("name");
		expect(res.body[0]).toHaveProperty("requiredDocuments");
		expect(res.body[0]).toHaveProperty("benefits");
	});

	it("returns 401 without auth", async () => {
		const res = await request(app).get("/discounts");
		expect(res.status).toBe(401);
	});
});

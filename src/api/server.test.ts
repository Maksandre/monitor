import { describe, it, expect, beforeEach } from "vitest";
import { openDb, type DB } from "../db/index.js";
import { Registry } from "../plugins/registry.js";
import { buildServer } from "./server.js";

let db: DB;
beforeEach(() => { db = openDb(":memory:"); });

describe("server", () => {
  it("responds to GET /api/health", async () => {
    const app = buildServer(db, new Registry());
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
    await app.close();
  });
});

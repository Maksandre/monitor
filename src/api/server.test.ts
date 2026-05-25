import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { openDb, type DB } from "../db/index.js";
import { Registry } from "../plugins/registry.js";
import { buildServer } from "./server.js";
import type { Source } from "../types.js";

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

  it("lists source types with their field descriptors", async () => {
    const reg = new Registry();
    const src: Source<any> = {
      type: "github-pull-requests", displayName: "GitHub Pull Requests",
      configSchema: z.any(), fields: [{ name: "repo", label: "Repo", type: "text", required: true }],
      check: async () => ({ events: [], state: {} }),
    };
    reg.registerSource(src);
    const app = buildServer(db, reg);
    const res = await app.inject({ method: "GET", url: "/api/source-types" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { type: "github-pull-requests", displayName: "GitHub Pull Requests", fields: [{ name: "repo", label: "Repo", type: "text", required: true }] },
    ]);
    await app.close();
  });
});

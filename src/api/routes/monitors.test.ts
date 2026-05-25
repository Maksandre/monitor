import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { openDb, type DB } from "../../db/index.js";
import { Registry } from "../../plugins/registry.js";
import { buildServer } from "../server.js";
import type { Source } from "../../types.js";

let db: DB;
let app: ReturnType<typeof buildServer>;

const src: Source<any> = {
  type: "github-pull-requests", displayName: "GH",
  configSchema: z.object({ repo: z.string().regex(/^[^/]+\/[^/]+$/), titleMatch: z.string().min(1) }).passthrough(),
  fields: [],
  check: async () => ({ events: [{ dedupeKey: "pr:1:opened", kind: "opened", title: "PR #1 opened", url: "u", payload: {} }], state: {} }),
};

beforeEach(() => {
  db = openDb(":memory:");
  const reg = new Registry();
  reg.registerSource(src);
  app = buildServer(db, reg);
});

async function createMonitor() {
  return app.inject({
    method: "POST", url: "/api/monitors",
    payload: { name: "sub", sourceType: "github-pull-requests", config: { repo: "o/r", titleMatch: "x" }, channelId: null, pollIntervalSec: 120 },
  });
}

describe("monitors API", () => {
  it("creates and lists a monitor", async () => {
    expect((await createMonitor()).statusCode).toBe(201);
    const list = await app.inject({ method: "GET", url: "/api/monitors" });
    expect(list.json()).toHaveLength(1);
    expect(list.json()[0].name).toBe("sub");
  });

  it("rejects invalid source config", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/monitors",
      payload: { name: "bad", sourceType: "github-pull-requests", config: { repo: "noslash", titleMatch: "x" }, channelId: null, pollIntervalSec: 120 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("toggles enabled", async () => {
    const id = (await createMonitor()).json().id;
    await app.inject({ method: "POST", url: `/api/monitors/${id}/toggle`, payload: { enabled: false } });
    expect((await app.inject({ method: "GET", url: "/api/monitors" })).json()[0].enabled).toBe(false);
  });

  it("dry-run test returns candidate events without persisting or alerting", async () => {
    const id = (await createMonitor()).json().id;
    const res = await app.inject({ method: "POST", url: `/api/monitors/${id}/test` });
    expect(res.statusCode).toBe(200);
    expect(res.json().events[0].dedupeKey).toBe("pr:1:opened");
    const alerts = await app.inject({ method: "GET", url: `/api/monitors/${id}/alerts` });
    expect(alerts.json()).toHaveLength(0);
  });

  it("deletes a monitor", async () => {
    const id = (await createMonitor()).json().id;
    expect((await app.inject({ method: "DELETE", url: `/api/monitors/${id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/monitors" })).json()).toHaveLength(0);
  });

  it("returns 400 for an unknown source type", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/monitors",
      payload: { name: "x", sourceType: "does-not-exist", config: {}, channelId: null, pollIntervalSec: 120 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when updating a nonexistent monitor", async () => {
    const res = await app.inject({
      method: "PUT", url: "/api/monitors/nope",
      payload: { name: "x", sourceType: "github-pull-requests", config: { repo: "o/r", titleMatch: "x" }, channelId: null, pollIntervalSec: 120 },
    });
    expect(res.statusCode).toBe(404);
  });
});

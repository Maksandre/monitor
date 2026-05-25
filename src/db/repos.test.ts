import { describe, it, expect, beforeEach } from "vitest";
import { openDb, type DB } from "./index.js";
import * as channels from "./channels.js";
import * as monitors from "./monitors.js";
import * as events from "./events.js";
import * as alerts from "./alerts.js";

let db: DB;
beforeEach(() => {
  db = openDb(":memory:");
});

describe("channels repo", () => {
  it("creates and lists channels", () => {
    const c = channels.create(db, { name: "tg", notifierType: "telegram", config: { botToken: "b", chatId: "1" } });
    expect(c.id).toBeTruthy();
    expect(channels.list(db)).toHaveLength(1);
    expect(channels.get(db, c.id)?.name).toBe("tg");
  });
});

describe("monitors repo", () => {
  it("creates, lists, updates state and flags", () => {
    const m = monitors.create(db, {
      name: "sub", sourceType: "github-pull-requests", config: { repo: "o/r" },
      channelId: null, pollIntervalSec: 60,
    });
    expect(monitors.list(db)).toHaveLength(1);
    monitors.markPolled(db, m.id, { ok: true, state: { a: 1 }, baselined: true });
    const after = monitors.get(db, m.id)!;
    expect(after.baselined).toBe(1);
    expect(JSON.parse(after.state)).toEqual({ a: 1 });
    expect(after.lastError).toBeNull();
  });

  it("records errors with incrementing count", () => {
    const m = monitors.create(db, { name: "x", sourceType: "t", config: {}, channelId: null, pollIntervalSec: 60 });
    monitors.markPolled(db, m.id, { ok: false, error: "boom" });
    monitors.markPolled(db, m.id, { ok: false, error: "boom2" });
    const after = monitors.get(db, m.id)!;
    expect(after.errorCount).toBe(2);
    expect(after.lastError).toBe("boom2");
  });
});

describe("events repo dedup", () => {
  it("recordIfNew returns an id once per key, null afterwards", () => {
    const r1 = events.recordIfNew(db, "m1", { dedupeKey: "pr:1:opened", kind: "opened", title: "t", url: "u", payload: {} });
    const r2 = events.recordIfNew(db, "m1", { dedupeKey: "pr:1:opened", kind: "opened", title: "t", url: "u", payload: {} });
    expect(r1).not.toBeNull();
    expect(r2).toBeNull();
  });
});

describe("alerts repo", () => {
  it("logs an alert and lists by monitor", () => {
    alerts.log(db, { monitorId: "m1", eventId: 1, channelId: "c1", status: "sent", error: null });
    expect(alerts.listByMonitor(db, "m1")).toHaveLength(1);
  });
});

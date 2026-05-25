import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { openDb, type DB } from "../db/index.js";
import * as monitors from "../db/monitors.js";
import * as channels from "../db/channels.js";
import * as alerts from "../db/alerts.js";
import { Registry } from "../plugins/registry.js";
import { runMonitor } from "./runner.js";
import type { Source, Notifier, MonitorEvent } from "../types.js";

function makeSource(events: MonitorEvent[]): Source<any> {
  return {
    type: "test-src", displayName: "T", configSchema: z.any(), fields: [],
    check: async () => ({ events, state: { ticked: true } }),
  };
}
const sent: any[] = [];
function makeNotifier(): Notifier<any> {
  return {
    type: "test-notif", displayName: "N", configSchema: z.any(), fields: [],
    send: async (_c, alert) => { sent.push(alert); },
  };
}

let db: DB;
let reg: Registry;
beforeEach(() => {
  db = openDb(":memory:");
  reg = new Registry();
  reg.registerNotifier(makeNotifier());
  sent.length = 0;
});

const ev = (k: string): MonitorEvent => ({ dedupeKey: k, kind: "opened", title: k, url: "u", payload: {} });

describe("runMonitor", () => {
  it("first run seeds baseline silently (records events, no alerts)", async () => {
    reg.registerSource(makeSource([ev("pr:1:opened"), ev("pr:2:opened")]));
    const ch = channels.create(db, { name: "c", notifierType: "test-notif", config: {} });
    const m = monitors.create(db, { name: "m", sourceType: "test-src", config: {}, channelId: ch.id, pollIntervalSec: 60 });

    await runMonitor(db, reg, m.id);

    expect(sent).toHaveLength(0);
    expect(monitors.get(db, m.id)!.baselined).toBe(1);
  });

  it("after baseline, alerts only on newly-seen events", async () => {
    let events = [ev("pr:1:opened")];
    const src: Source<any> = { type: "test-src", displayName: "T", configSchema: z.any(), fields: [], check: async () => ({ events, state: {} }) };
    reg.registerSource(src);
    const ch = channels.create(db, { name: "c", notifierType: "test-notif", config: {} });
    const m = monitors.create(db, { name: "m", sourceType: "test-src", config: {}, channelId: ch.id, pollIntervalSec: 60 });

    await runMonitor(db, reg, m.id); // baseline: pr:1 recorded, no alert
    events = [ev("pr:1:opened"), ev("pr:2:opened")]; // pr:2 is new
    await runMonitor(db, reg, m.id);

    expect(sent.map((a) => a.event.dedupeKey)).toEqual(["pr:2:opened"]);
    expect(alerts.listByMonitor(db, m.id)).toHaveLength(1);
  });

  it("records source errors without throwing", async () => {
    const src: Source<any> = { type: "test-src", displayName: "T", configSchema: z.any(), fields: [], check: async () => { throw new Error("api down"); } };
    reg.registerSource(src);
    const m = monitors.create(db, { name: "m", sourceType: "test-src", config: {}, channelId: null, pollIntervalSec: 60 });

    await expect(runMonitor(db, reg, m.id)).resolves.toBeUndefined();
    expect(monitors.get(db, m.id)!.lastError).toContain("api down");
  });

  it("retries then logs a single failed alert when the notifier always throws", async () => {
    reg = new Registry();
    let events = [ev("pr:1:opened")];
    reg.registerSource({ type: "test-src", displayName: "T", configSchema: z.any(), fields: [], check: async () => ({ events, state: {} }) });
    reg.registerNotifier({ type: "boom", displayName: "B", configSchema: z.any(), fields: [], send: async () => { throw new Error("tg down"); } });
    const ch = channels.create(db, { name: "c", notifierType: "boom", config: {} });
    const m = monitors.create(db, { name: "m", sourceType: "test-src", config: {}, channelId: ch.id, pollIntervalSec: 60 });
    const noSleep = { sleep: async () => {} };

    await runMonitor(db, reg, m.id, noSleep); // baseline: records pr:1, no alert
    events = [ev("pr:1:opened"), ev("pr:2:opened")]; // pr:2 is new
    await runMonitor(db, reg, m.id, noSleep);

    const logged = alerts.listByMonitor(db, m.id);
    expect(logged).toHaveLength(1);
    expect(logged[0].status).toBe("failed");
    expect(logged[0].error).toContain("tg down");
  });

  it("retries delivery and succeeds on a later attempt", async () => {
    reg = new Registry();
    let events = [ev("pr:1:opened")];
    reg.registerSource({ type: "test-src", displayName: "T", configSchema: z.any(), fields: [], check: async () => ({ events, state: {} }) });
    let calls = 0;
    reg.registerNotifier({ type: "flaky", displayName: "F", configSchema: z.any(), fields: [], send: async () => { if (++calls < 2) throw new Error("blip"); } });
    const ch = channels.create(db, { name: "c", notifierType: "flaky", config: {} });
    const m = monitors.create(db, { name: "m", sourceType: "test-src", config: {}, channelId: ch.id, pollIntervalSec: 60 });
    const noSleep = { sleep: async () => {} };

    await runMonitor(db, reg, m.id, noSleep); // baseline
    events = [ev("pr:1:opened"), ev("pr:2:opened")];
    await runMonitor(db, reg, m.id, noSleep);

    const logged = alerts.listByMonitor(db, m.id);
    expect(logged).toHaveLength(1);
    expect(logged[0].status).toBe("sent");
    expect(calls).toBe(2);
  });
});

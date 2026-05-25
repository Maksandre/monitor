import { describe, it, expect, beforeEach } from "vitest";
import { openDb, type DB } from "./db/index.js";
import * as channels from "./db/channels.js";
import * as monitors from "./db/monitors.js";
import { seedDefaults } from "./seed.js";

let db: DB;
beforeEach(() => { db = openDb(":memory:"); });

describe("seedDefaults", () => {
  it("creates a telegram channel and subtensor monitor when telegram env is set", () => {
    seedDefaults(db, { telegram: { botToken: "b", chatId: "1" } });
    expect(channels.list(db)).toHaveLength(1);
    const m = monitors.list(db)[0];
    expect(m.sourceType).toBe("github-pull-requests");
    expect(JSON.parse(m.config).repo).toBe("opentensor/subtensor");
  });

  it("does nothing on a second run (idempotent)", () => {
    seedDefaults(db, { telegram: { botToken: "b", chatId: "1" } });
    seedDefaults(db, { telegram: { botToken: "b", chatId: "1" } });
    expect(monitors.list(db)).toHaveLength(1);
    expect(channels.list(db)).toHaveLength(1);
  });

  it("skips seeding when telegram env is missing", () => {
    seedDefaults(db, {});
    expect(channels.list(db)).toHaveLength(0);
    expect(monitors.list(db)).toHaveLength(0);
  });
});

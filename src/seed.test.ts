import { describe, it, expect, beforeEach } from "vitest";
import { openDb, type DB } from "./db/index.js";
import * as channels from "./db/channels.js";
import * as monitors from "./db/monitors.js";
import { seedDefaults } from "./seed.js";

let db: DB;
beforeEach(() => { db = openDb(":memory:"); });

describe("seedDefaults", () => {
  it("creates a default telegram channel and no monitors when telegram env is set", () => {
    seedDefaults(db, { telegram: { botToken: "b", chatId: "1" } });
    expect(channels.list(db)).toHaveLength(1);
    expect(channels.list(db)[0].notifierType).toBe("telegram");
    expect(monitors.list(db)).toHaveLength(0);
  });

  it("does nothing on a second run (idempotent)", () => {
    seedDefaults(db, { telegram: { botToken: "b", chatId: "1" } });
    seedDefaults(db, { telegram: { botToken: "b", chatId: "1" } });
    expect(channels.list(db)).toHaveLength(1);
  });

  it("skips seeding when telegram env is missing", () => {
    seedDefaults(db, {});
    expect(channels.list(db)).toHaveLength(0);
  });
});

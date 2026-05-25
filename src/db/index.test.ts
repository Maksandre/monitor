import { describe, it, expect } from "vitest";
import { openDb } from "./index.js";

describe("openDb", () => {
  it("creates all tables on an in-memory db", () => {
    const db = openDb(":memory:");
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = rows.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(["alerts", "channels", "events", "monitors"]));
  });
});

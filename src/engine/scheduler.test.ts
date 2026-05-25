import { describe, it, expect } from "vitest";
import { isDue, effectiveIntervalSec } from "./scheduler.js";
import type { MonitorRow } from "../types.js";

function row(p: Partial<MonitorRow>): MonitorRow {
  return {
    id: "1", name: "m", sourceType: "s", config: "{}", channelId: null, pollIntervalSec: 60,
    enabled: 1, baselined: 0, lastPolledAt: null, lastError: null, errorCount: 0, state: "{}",
    createdAt: "2026-01-01T00:00:00Z", ...p,
  };
}

describe("isDue", () => {
  it("is due when never polled", () => {
    expect(isDue(row({ lastPolledAt: null }), new Date("2026-01-01T00:00:00Z"))).toBe(true);
  });
  it("is not due before the interval elapses", () => {
    const last = "2026-01-01T00:00:00Z";
    expect(isDue(row({ lastPolledAt: last, pollIntervalSec: 60 }), new Date("2026-01-01T00:00:30Z"))).toBe(false);
  });
  it("is due once the interval has elapsed", () => {
    const last = "2026-01-01T00:00:00Z";
    expect(isDue(row({ lastPolledAt: last, pollIntervalSec: 60 }), new Date("2026-01-01T00:01:01Z"))).toBe(true);
  });
});

describe("effectiveIntervalSec backoff", () => {
  it("equals base interval with no errors", () => {
    expect(effectiveIntervalSec(row({ pollIntervalSec: 60, errorCount: 0 }))).toBe(60);
  });
  it("doubles per error up to a cap of 16x", () => {
    expect(effectiveIntervalSec(row({ pollIntervalSec: 60, errorCount: 2 }))).toBe(240);
    expect(effectiveIntervalSec(row({ pollIntervalSec: 60, errorCount: 10 }))).toBe(60 * 16);
  });
});

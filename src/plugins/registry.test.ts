import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Registry } from "./registry.js";
import type { Source } from "../types.js";

const fakeSource: Source<{ x: string }> = {
  type: "fake",
  displayName: "Fake",
  configSchema: z.object({ x: z.string() }),
  fields: [{ name: "x", label: "X", type: "text", required: true }],
  check: async () => ({ events: [], state: {} }),
};

describe("Registry", () => {
  it("registers and retrieves a source", () => {
    const r = new Registry();
    r.registerSource(fakeSource);
    expect(r.getSource("fake")).toBe(fakeSource);
    expect(r.listSources().map((s) => s.type)).toEqual(["fake"]);
  });

  it("throws on unknown source", () => {
    const r = new Registry();
    expect(() => r.getSource("nope")).toThrow(/unknown source/i);
  });

  it("throws on duplicate registration", () => {
    const r = new Registry();
    r.registerSource(fakeSource);
    expect(() => r.registerSource(fakeSource)).toThrow(/already registered/i);
  });
});

import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("uses defaults when env is empty", () => {
    const c = loadConfig({});
    expect(c.port).toBe(8080);
    expect(c.dbPath).toBe("data/monitor.db");
    expect(c.githubToken).toBeUndefined();
  });

  it("reads overrides from env", () => {
    const c = loadConfig({ PORT: "9000", DB_PATH: "/tmp/x.db", GITHUB_TOKEN: "tok" });
    expect(c.port).toBe(9000);
    expect(c.dbPath).toBe("/tmp/x.db");
    expect(c.githubToken).toBe("tok");
  });
});

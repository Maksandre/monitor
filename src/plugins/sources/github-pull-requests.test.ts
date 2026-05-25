import { describe, it, expect } from "vitest";
import { githubPullRequestsSource, type GithubPrConfig } from "./github-pull-requests.js";
import type { GithubClient, PullRequest } from "../github-client.js";
import { subtensorPrs } from "./__fixtures__/subtensor-prs.ts";

function clientReturning(prs: PullRequest[]): GithubClient {
  return { listPullRequests: async () => prs };
}

const baseConfig: GithubPrConfig = {
  repo: "opentensor/subtensor",
  titleMatch: "mainnet deploy",
  excludeMatch: "",
  labels: [],
  triggerKinds: ["opened", "merged"],
};

describe("githubPullRequestsSource", () => {
  it("emits opened+merged events only for matching PRs", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    const { events } = await src.check(baseConfig, {});
    const keys = events.map((e) => e.dedupeKey).sort();
    expect(keys).toEqual(["pr:2458:merged", "pr:2562:merged", "pr:2615:merged", "pr:2643:opened"]);
  });

  it("respects excludeMatch (drops Revert PRs)", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    const { events } = await src.check({ ...baseConfig, excludeMatch: "revert" }, {});
    expect(events.map((e) => e.dedupeKey)).not.toContain("pr:2458:merged");
  });

  it("respects label AND-filter", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    const { events } = await src.check({ ...baseConfig, labels: ["deploy-mainnet"] }, {});
    expect(events.map((e) => e.dedupeKey)).toEqual(["pr:2562:merged"]);
  });

  it("only emits configured triggerKinds", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    const { events } = await src.check({ ...baseConfig, triggerKinds: ["opened"] }, {});
    expect(events.map((e) => e.dedupeKey)).toEqual(["pr:2643:opened"]);
  });

  it("validates config via schema (rejects bad repo)", () => {
    expect(() => githubPullRequestsSource(clientReturning([])).configSchema.parse({ ...baseConfig, repo: "noslash" })).toThrow();
  });

  it("builds a readable event title and url", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    const { events } = await src.check({ ...baseConfig, triggerKinds: ["opened"] }, {});
    expect(events[0].title).toMatch(/#2643/);
    expect(events[0].title.toLowerCase()).toContain("opened");
    expect(events[0].url).toContain("/pull/2643");
  });

  it("supports /regex/ title matching", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    const { events } = await src.check({ ...baseConfig, titleMatch: "/mainnet deploy \\d/", triggerKinds: ["opened"] }, {});
    expect(events.map((e) => e.dedupeKey)).toEqual(["pr:2643:opened"]);
  });

  it("falls back to substring (does not throw) on an invalid regex pattern", async () => {
    const src = githubPullRequestsSource(clientReturning(subtensorPrs));
    await expect(src.check({ ...baseConfig, titleMatch: "/[deploy/" }, {})).resolves.toBeDefined();
  });
});

import { describe, it, expect, vi } from "vitest";
import { HttpGithubClient } from "./github-client.js";

describe("HttpGithubClient", () => {
  it("requests the pulls endpoint with auth and parses results", async () => {
    const fakeFetch = vi.fn(async () =>
      new Response(
        JSON.stringify([
          { number: 1, title: "x", state: "open", merged_at: null, html_url: "u", labels: [{ name: "a" }] },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const client = new HttpGithubClient("tok", fakeFetch as unknown as typeof fetch);
    const prs = await client.listPullRequests("owner/repo");

    expect(prs[0]).toEqual({ number: 1, title: "x", state: "open", mergedAt: null, url: "u", labels: ["a"] });
    const [url, init] = fakeFetch.mock.calls[0];
    expect(url).toContain("https://api.github.com/repos/owner/repo/pulls");
    expect(url).toContain("state=all");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer tok" });
  });

  it("throws with status on non-2xx", async () => {
    const fakeFetch = vi.fn(async () => new Response("nope", { status: 403 }));
    const client = new HttpGithubClient(undefined, fakeFetch as unknown as typeof fetch);
    await expect(client.listPullRequests("o/r")).rejects.toThrow(/403/);
  });
});

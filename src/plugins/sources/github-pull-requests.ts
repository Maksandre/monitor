import { z } from "zod";
import type { Source, MonitorEvent, FieldDescriptor } from "../../types.js";
import type { GithubClient, PullRequest } from "../github-client.js";

export const githubPrConfigSchema = z.object({
  repo: z.string().regex(/^[^/]+\/[^/]+$/, "repo must be owner/name"),
  titleMatch: z.string().min(1),
  excludeMatch: z.string().default(""),
  labels: z.array(z.string()).default([]),
  triggerKinds: z.array(z.enum(["opened", "merged", "closed"])).min(1).default(["opened", "merged"]),
});

export type GithubPrConfig = z.infer<typeof githubPrConfigSchema>;

const fields: FieldDescriptor[] = [
  { name: "repo", label: "Repository (owner/name)", type: "text", required: true, default: "opentensor/subtensor" },
  { name: "titleMatch", label: "Title contains", type: "text", required: true, default: "mainnet deploy", help: "Case-insensitive substring or /regex/" },
  { name: "excludeMatch", label: "Exclude titles containing", type: "text", required: false, default: "", help: "Optional; e.g. revert" },
  { name: "labels", label: "Required labels (all)", type: "tags", required: false, default: [] },
  { name: "triggerKinds", label: "Alert on", type: "multiselect", required: true, default: ["opened", "merged"], options: ["opened", "merged", "closed"] },
];

function matchesTitle(title: string, pattern: string): boolean {
  const m = pattern.match(/^\/(.*)\/(\w*)$/);
  if (m) return new RegExp(m[1], m[2].includes("i") ? m[2] : m[2] + "i").test(title);
  return title.toLowerCase().includes(pattern.toLowerCase());
}

function kindOf(pr: PullRequest): "opened" | "merged" | "closed" {
  if (pr.state === "open") return "opened";
  return pr.mergedAt ? "merged" : "closed";
}

export function githubPullRequestsSource(client: GithubClient): Source<GithubPrConfig> {
  return {
    type: "github-pull-requests",
    displayName: "GitHub Pull Requests",
    configSchema: githubPrConfigSchema,
    fields,
    async check(config, _state) {
      const prs = await client.listPullRequests(config.repo);
      const events: MonitorEvent[] = [];
      for (const pr of prs) {
        if (!matchesTitle(pr.title, config.titleMatch)) continue;
        if (config.excludeMatch && matchesTitle(pr.title, config.excludeMatch)) continue;
        if (config.labels.length && !config.labels.every((l) => pr.labels.includes(l))) continue;
        const kind = kindOf(pr);
        if (!config.triggerKinds.includes(kind)) continue;
        events.push({
          dedupeKey: `pr:${pr.number}:${kind}`,
          kind,
          title: `PR #${pr.number} ${kind}: ${pr.title}`,
          url: pr.url,
          payload: { number: pr.number, repo: config.repo, prTitle: pr.title, labels: pr.labels },
        });
      }
      return { events, state: { lastCheckedAt: new Date().toISOString() } };
    },
  };
}

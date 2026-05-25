import type { PullRequest } from "../../github-client.js";

export const subtensorPrs: PullRequest[] = [
  { number: 2643, title: "mainnet deploy 5/26/2026", state: "open", mergedAt: null, url: "https://github.com/opentensor/subtensor/pull/2643", labels: ["breaking-change"] },
  { number: 2615, title: "mainnet deploy 4-23-2026 (part 2)", state: "closed", mergedAt: "2026-04-23T22:00:00Z", url: "u2615", labels: ["skip-cargo-audit"] },
  { number: 2562, title: "mainnet deploy 4/22/2026", state: "closed", mergedAt: "2026-04-03T04:00:00Z", url: "u2562", labels: ["deploy-mainnet"] },
  { number: 2494, title: "mainnet deploy (part 2) 3/17/2025", state: "closed", mergedAt: null, url: "u2494", labels: [] }, // closed unmerged
  { number: 2458, title: 'Revert "mainnet deploy 2/20/2026"', state: "closed", mergedAt: "2026-02-24T21:00:00Z", url: "u2458", labels: ["hotfix"] },
  { number: 9999, title: "Fix typo in README", state: "open", mergedAt: null, url: "u9999", labels: [] }, // non-matching
];

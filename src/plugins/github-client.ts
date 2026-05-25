export interface PullRequest {
  number: number;
  title: string;
  state: "open" | "closed";
  mergedAt: string | null;
  url: string;
  labels: string[];
}

export interface GithubClient {
  listPullRequests(repo: string): Promise<PullRequest[]>;
}

export class HttpGithubClient implements GithubClient {
  constructor(
    private token: string | undefined,
    private fetchFn: typeof fetch = fetch,
  ) {}

  async listPullRequests(repo: string): Promise<PullRequest[]> {
    const url = `https://api.github.com/repos/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "monitor-app",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await this.fetchFn(url, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const raw = (await res.json()) as any[];
    return raw.map((p) => ({
      number: p.number,
      title: p.title,
      state: p.state,
      mergedAt: p.merged_at ?? null,
      url: p.html_url,
      labels: (p.labels ?? []).map((l: any) => l.name),
    }));
  }
}

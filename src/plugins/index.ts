import { Registry } from "./registry.js";
import { HttpGithubClient } from "./github-client.js";
import { githubPullRequestsSource } from "./sources/github-pull-requests.js";
import { telegramNotifier } from "./notifiers/telegram.js";
import type { AppConfig } from "../config.js";

export function buildRegistry(config: AppConfig): Registry {
  const reg = new Registry();
  reg.registerSource(githubPullRequestsSource(new HttpGithubClient(config.githubToken)));
  reg.registerNotifier(telegramNotifier());
  return reg;
}

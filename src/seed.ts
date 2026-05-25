import type { DB } from "./db/index.js";
import * as channels from "./db/channels.js";
import * as monitors from "./db/monitors.js";
import { logger } from "./logger.js";

interface SeedConfig {
  telegram?: { botToken: string; chatId: string };
}

const SEEDED_MARKER = "default-subtensor";

export function seedDefaults(db: DB, config: SeedConfig): void {
  const already = monitors.list(db).some((m) => m.name === SEEDED_MARKER);
  if (already || !config.telegram) return;

  const ch = channels.create(db, {
    name: "Telegram (default)",
    notifierType: "telegram",
    config: config.telegram,
  });
  monitors.create(db, {
    name: SEEDED_MARKER,
    sourceType: "github-pull-requests",
    config: {
      repo: "opentensor/subtensor",
      titleMatch: "mainnet deploy",
      excludeMatch: "",
      labels: [],
      triggerKinds: ["opened", "merged"],
    },
    channelId: ch.id,
    pollIntervalSec: 120,
  });
  logger.info("seeded default subtensor monitor + telegram channel");
}

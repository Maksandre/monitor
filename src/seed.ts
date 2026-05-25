import type { DB } from "./db/index.js";
import * as channels from "./db/channels.js";
import { logger } from "./logger.js";

interface SeedConfig {
  telegram?: { botToken: string; chatId: string };
}

const DEFAULT_CHANNEL_NAME = "Telegram (default)";

// On first run, if Telegram env vars are present, create a default Telegram
// channel so you only have to add monitors in the UI. No monitors are pre-created.
export function seedDefaults(db: DB, config: SeedConfig): void {
  if (!config.telegram) return;
  const already = channels.list(db).some((c) => c.name === DEFAULT_CHANNEL_NAME);
  if (already) return;
  channels.create(db, {
    name: DEFAULT_CHANNEL_NAME,
    notifierType: "telegram",
    config: config.telegram,
  });
  logger.info("seeded default telegram channel from env");
}

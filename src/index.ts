import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { openDb } from "./db/index.js";
import { buildRegistry } from "./plugins/index.js";
import { seedDefaults } from "./seed.js";
import { Scheduler } from "./engine/scheduler.js";
import { buildServer } from "./api/server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const db = openDb(config.dbPath);
  const reg = buildRegistry(config);
  seedDefaults(db, { telegram: config.telegram });

  const scheduler = new Scheduler(db, reg);
  scheduler.start();

  const server = buildServer(db, reg);
  await server.listen({ host: "0.0.0.0", port: config.port });
  logger.info({ port: config.port }, "monitor running");

  const shutdown = () => { scheduler.stop(); server.close().then(() => process.exit(0)); };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.error(err, "fatal");
  process.exit(1);
});

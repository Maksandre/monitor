export interface AppConfig {
  port: number;
  dbPath: string;
  githubToken?: string;
  telegram?: { botToken: string; chatId: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const tgToken = env.TELEGRAM_BOT_TOKEN;
  const tgChat = env.TELEGRAM_CHAT_ID;
  return {
    port: env.PORT ? Number(env.PORT) : 8080,
    dbPath: env.DB_PATH ?? "data/monitor.db",
    githubToken: env.GITHUB_TOKEN || undefined,
    telegram: tgToken && tgChat ? { botToken: tgToken, chatId: tgChat } : undefined,
  };
}

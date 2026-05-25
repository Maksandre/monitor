import { z } from "zod";
import type { Notifier, FieldDescriptor } from "../../types.js";

export const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
});

export type TelegramConfig = z.infer<typeof telegramConfigSchema>;

const fields: FieldDescriptor[] = [
  { name: "botToken", label: "Bot token", type: "password", required: true, help: "From @BotFather" },
  { name: "chatId", label: "Chat ID", type: "text", required: true, help: "Your numeric chat id" },
];

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function telegramNotifier(fetchFn: typeof fetch = fetch): Notifier<TelegramConfig> {
  return {
    type: "telegram",
    displayName: "Telegram",
    configSchema: telegramConfigSchema,
    fields,
    async send(config, alert) {
      const text = `🔔 <b>${escapeHtml(alert.monitorName)}</b>\n${escapeHtml(alert.event.title)}\n${alert.event.url}`;
      const res = await fetchFn(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
      });
      if (!res.ok) throw new Error(`Telegram send failed ${res.status}: ${await res.text()}`);
    },
  };
}

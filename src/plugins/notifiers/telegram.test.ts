import { describe, it, expect, vi } from "vitest";
import { telegramNotifier } from "./telegram.js";

describe("telegramNotifier", () => {
  it("POSTs a formatted message to the bot API", async () => {
    const fakeFetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const n = telegramNotifier(fakeFetch as unknown as typeof fetch);
    await n.send(
      { botToken: "BOT", chatId: "123" },
      { monitorName: "Subtensor", event: { dedupeKey: "k", kind: "opened", title: "PR #1 opened: x", url: "https://h/pull/1", payload: {} } },
    );
    const [url, init] = fakeFetch.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botBOT/sendMessage");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("123");
    expect(body.text).toContain("Subtensor");
    expect(body.text).toContain("PR #1 opened");
    expect(body.text).toContain("https://h/pull/1");
  });

  it("throws when Telegram returns an error", async () => {
    const fakeFetch = vi.fn(async () => new Response(JSON.stringify({ ok: false, description: "bad" }), { status: 400 }));
    const n = telegramNotifier(fakeFetch as unknown as typeof fetch);
    await expect(
      n.send({ botToken: "B", chatId: "1" }, { monitorName: "m", event: { dedupeKey: "k", kind: "x", title: "t", url: "u", payload: {} } }),
    ).rejects.toThrow(/telegram/i);
  });
});

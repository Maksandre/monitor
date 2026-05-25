import { describe, it, expect, beforeEach } from "vitest";
import { openDb, type DB } from "../../db/index.js";
import { Registry } from "../../plugins/registry.js";
import { telegramNotifier } from "../../plugins/notifiers/telegram.js";
import { buildServer } from "../server.js";

let db: DB;
let app: ReturnType<typeof buildServer>;
beforeEach(() => {
  db = openDb(":memory:");
  const reg = new Registry();
  reg.registerNotifier(telegramNotifier());
  app = buildServer(db, reg);
});

describe("channels API", () => {
  it("creates, lists, and deletes a channel; redacts secrets on read", async () => {
    const create = await app.inject({
      method: "POST", url: "/api/channels",
      payload: { name: "tg", notifierType: "telegram", config: { botToken: "secret", chatId: "1" } },
    });
    expect(create.statusCode).toBe(201);
    const id = create.json().id;

    const list = await app.inject({ method: "GET", url: "/api/channels" });
    expect(list.json()).toHaveLength(1);
    expect(list.json()[0].config.botToken).toBe("***"); // redacted

    const del = await app.inject({ method: "DELETE", url: `/api/channels/${id}` });
    expect(del.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/channels" })).json()).toHaveLength(0);
  });

  it("rejects invalid notifier config", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/channels",
      payload: { name: "bad", notifierType: "telegram", config: { botToken: "" } },
    });
    expect(res.statusCode).toBe(400);
  });

  it("updates a channel against its stored type and keeps secrets redacted", async () => {
    const create = await app.inject({
      method: "POST", url: "/api/channels",
      payload: { name: "tg", notifierType: "telegram", config: { botToken: "secret", chatId: "1" } },
    });
    const id = create.json().id;
    const put = await app.inject({ method: "PUT", url: `/api/channels/${id}`, payload: { name: "tg2", config: { botToken: "newsecret", chatId: "2" } } });
    expect(put.statusCode).toBe(204);
    const list = await app.inject({ method: "GET", url: "/api/channels" });
    expect(list.json()[0].name).toBe("tg2");
    expect(list.json()[0].config.botToken).toBe("***");
    expect(list.json()[0].config.chatId).toBe("2");
  });

  it("returns 404 when updating a nonexistent channel", async () => {
    const res = await app.inject({ method: "PUT", url: "/api/channels/nope", payload: { name: "x", config: { botToken: "b", chatId: "1" } } });
    expect(res.statusCode).toBe(404);
  });
});

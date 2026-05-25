import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DB } from "../../db/index.js";
import type { Registry } from "../../plugins/registry.js";
import * as channels from "../../db/channels.js";

const upsertSchema = z.object({
  name: z.string().min(1),
  notifierType: z.string().min(1),
  config: z.record(z.unknown()),
});

function redact(row: { config: string; notifierType: string }, reg: Registry) {
  const cfg = JSON.parse(row.config) as Record<string, unknown>;
  const notifier = reg.listNotifiers().find((n) => n.type === row.notifierType);
  for (const f of notifier?.fields ?? []) if (f.type === "password" && cfg[f.name]) cfg[f.name] = "***";
  return cfg;
}

export function channelRoutes(app: FastifyInstance, db: DB, reg: Registry): void {
  app.get("/api/channels", async () =>
    channels.list(db).map((c) => ({ id: c.id, name: c.name, notifierType: c.notifierType, config: redact(c, reg) })),
  );

  app.post("/api/channels", async (req, reply) => {
    const body = upsertSchema.parse(req.body);
    reg.getNotifier(body.notifierType).configSchema.parse(body.config); // validate
    const c = channels.create(db, body);
    return reply.code(201).send({ id: c.id });
  });

  app.put("/api/channels/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = upsertSchema.parse(req.body);
    reg.getNotifier(body.notifierType).configSchema.parse(body.config);
    channels.update(db, id, { name: body.name, config: body.config });
    return reply.code(204).send();
  });

  app.delete("/api/channels/:id", async (req, reply) => {
    channels.remove(db, (req.params as { id: string }).id);
    return reply.code(204).send();
  });
}

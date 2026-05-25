import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DB } from "../../db/index.js";
import type { Registry } from "../../plugins/registry.js";
import * as monitors from "../../db/monitors.js";
import * as alerts from "../../db/alerts.js";
import type { MonitorRow } from "../../types.js";

const upsertSchema = z.object({
  name: z.string().min(1),
  sourceType: z.string().min(1),
  config: z.record(z.unknown()),
  channelId: z.string().nullable(),
  pollIntervalSec: z.number().int().min(15),
});

function toDto(m: MonitorRow) {
  return {
    id: m.id, name: m.name, sourceType: m.sourceType, config: JSON.parse(m.config),
    channelId: m.channelId, pollIntervalSec: m.pollIntervalSec, enabled: m.enabled === 1,
    baselined: m.baselined === 1, lastPolledAt: m.lastPolledAt, lastError: m.lastError, errorCount: m.errorCount,
  };
}

export function monitorRoutes(app: FastifyInstance, db: DB, reg: Registry): void {
  app.get("/api/monitors", async () => monitors.list(db).map(toDto));

  app.get("/api/monitors/:id", async (req, reply) => {
    const m = monitors.get(db, (req.params as { id: string }).id);
    return m ? toDto(m) : reply.code(404).send({ error: "not found" });
  });

  app.post("/api/monitors", async (req, reply) => {
    const body = upsertSchema.parse(req.body);
    reg.getSource(body.sourceType).configSchema.parse(body.config); // validate config
    const m = monitors.create(db, body);
    return reply.code(201).send({ id: m.id });
  });

  app.put("/api/monitors/:id", async (req, reply) => {
    const existing = monitors.get(db, (req.params as { id: string }).id);
    if (!existing) return reply.code(404).send({ error: "not found" });
    const body = upsertSchema.parse(req.body);
    reg.getSource(existing.sourceType).configSchema.parse(body.config); // validate against the monitor's real type
    monitors.update(db, existing.id, {
      name: body.name, config: body.config, channelId: body.channelId, pollIntervalSec: body.pollIntervalSec,
    });
    return reply.code(204).send();
  });

  app.post("/api/monitors/:id/toggle", async (req, reply) => {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
    monitors.setEnabled(db, (req.params as { id: string }).id, enabled);
    return reply.code(204).send();
  });

  app.delete("/api/monitors/:id", async (req, reply) => {
    monitors.remove(db, (req.params as { id: string }).id);
    return reply.code(204).send();
  });

  // Dry-run: run the source check, return candidate events; persist nothing, send nothing.
  app.post("/api/monitors/:id/test", async (req, reply) => {
    const m = monitors.get(db, (req.params as { id: string }).id);
    if (!m) return reply.code(404).send({ error: "not found" });
    const source = reg.getSource(m.sourceType);
    const config = source.configSchema.parse(JSON.parse(m.config));
    const { events } = await source.check(config, JSON.parse(m.state));
    return { events };
  });

  app.get("/api/monitors/:id/alerts", async (req) =>
    alerts.listByMonitor(db, (req.params as { id: string }).id),
  );
}

import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { DB } from "../db/index.js";
import type { Registry } from "../plugins/registry.js";
import { healthRoutes } from "./routes/health.js";
import { pluginTypeRoutes } from "./routes/plugin-types.js";
import { channelRoutes } from "./routes/channels.js";

export function buildServer(db: DB, reg: Registry): FastifyInstance {
  const app = Fastify({ logger: false });

  app.setErrorHandler((err, _req, reply) => {
    if ((err as any).name === "ZodError") return reply.code(400).send({ error: "validation", details: (err as any).issues });
    return reply.code(500).send({ error: err.message });
  });

  healthRoutes(app);
  pluginTypeRoutes(app, reg);
  channelRoutes(app, db, reg);
  // monitor, alert routes are registered here in later tasks

  const webDir = fileURLToPath(new URL("../../web/dist", import.meta.url));
  if (existsSync(webDir)) {
    app.register(fastifyStatic, { root: webDir });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api")) return reply.code(404).send({ error: "not found" });
      return reply.sendFile("index.html");
    });
  }
  return app;
}

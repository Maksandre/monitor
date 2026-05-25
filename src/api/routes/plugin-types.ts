import type { FastifyInstance } from "fastify";
import type { Registry } from "../../plugins/registry.js";

export function pluginTypeRoutes(app: FastifyInstance, reg: Registry): void {
  app.get("/api/source-types", async () =>
    reg.listSources().map((s) => ({ type: s.type, displayName: s.displayName, fields: s.fields })),
  );
  app.get("/api/notifier-types", async () =>
    reg.listNotifiers().map((n) => ({ type: n.type, displayName: n.displayName, fields: n.fields })),
  );
}

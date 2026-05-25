import type { FastifyInstance } from "fastify";
import type { DB } from "../../db/index.js";
import * as alerts from "../../db/alerts.js";

export function alertRoutes(app: FastifyInstance, db: DB): void {
  app.get("/api/alerts", async () =>
    alerts.listRecent(db).map((a) => ({ ...a, payload: undefined })),
  );
}

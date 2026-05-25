import type { DB } from "./index.js";
import type { AlertRow } from "../types.js";

export function log(
  db: DB,
  input: { monitorId: string; eventId: number; channelId: string | null; status: string; error: string | null },
): void {
  db.prepare(
    "INSERT INTO alerts (monitorId,eventId,channelId,status,error,sentAt) VALUES (?,?,?,?,?,?)",
  ).run(input.monitorId, input.eventId, input.channelId, input.status, input.error, new Date().toISOString());
}
export function listByMonitor(db: DB, monitorId: string): AlertRow[] {
  return db.prepare("SELECT * FROM alerts WHERE monitorId=? ORDER BY sentAt DESC LIMIT 200").all(monitorId) as AlertRow[];
}
export function listRecent(db: DB): AlertRow[] {
  return db.prepare("SELECT * FROM alerts ORDER BY sentAt DESC LIMIT 200").all() as AlertRow[];
}

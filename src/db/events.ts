import type { DB } from "./index.js";
import type { EventRow, MonitorEvent } from "../types.js";

/** Insert if (monitorId,dedupeKey) is new. Returns the new row id, or null if it already existed. */
export function recordIfNew(db: DB, monitorId: string, e: MonitorEvent): number | null {
  const res = db
    .prepare(
      `INSERT OR IGNORE INTO events (monitorId,dedupeKey,kind,title,url,payload,seenAt)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(monitorId, e.dedupeKey, e.kind, e.title, e.url, JSON.stringify(e.payload), new Date().toISOString());
  return res.changes > 0 ? Number(res.lastInsertRowid) : null;
}
export function listByMonitor(db: DB, monitorId: string): EventRow[] {
  return db.prepare("SELECT * FROM events WHERE monitorId=? ORDER BY seenAt DESC").all(monitorId) as EventRow[];
}

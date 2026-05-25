import { randomUUID } from "node:crypto";
import type { DB } from "./index.js";
import type { MonitorRow } from "../types.js";

export function create(
  db: DB,
  input: { name: string; sourceType: string; config: object; channelId: string | null; pollIntervalSec: number; enabled?: boolean },
): MonitorRow {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO monitors (id,name,sourceType,config,channelId,pollIntervalSec,enabled,baselined,errorCount,state,createdAt)
     VALUES (?,?,?,?,?,?,?,0,0,'{}',?)`,
  ).run(id, input.name, input.sourceType, JSON.stringify(input.config), input.channelId, input.pollIntervalSec, input.enabled === false ? 0 : 1, new Date().toISOString());
  return get(db, id)!;
}
export function list(db: DB): MonitorRow[] {
  return db.prepare("SELECT * FROM monitors ORDER BY createdAt").all() as MonitorRow[];
}
export function listEnabled(db: DB): MonitorRow[] {
  return db.prepare("SELECT * FROM monitors WHERE enabled=1").all() as MonitorRow[];
}
export function get(db: DB, id: string): MonitorRow | undefined {
  return db.prepare("SELECT * FROM monitors WHERE id=?").get(id) as MonitorRow | undefined;
}
export function update(
  db: DB,
  id: string,
  input: { name: string; config: object; channelId: string | null; pollIntervalSec: number },
): void {
  db.prepare("UPDATE monitors SET name=?, config=?, channelId=?, pollIntervalSec=? WHERE id=?").run(
    input.name, JSON.stringify(input.config), input.channelId, input.pollIntervalSec, id,
  );
}
export function setEnabled(db: DB, id: string, enabled: boolean): void {
  db.prepare("UPDATE monitors SET enabled=? WHERE id=?").run(enabled ? 1 : 0, id);
}
export function remove(db: DB, id: string): void {
  db.prepare("DELETE FROM monitors WHERE id=?").run(id);
}

export function markPolled(
  db: DB,
  id: string,
  result: { ok: true; state: object; baselined: boolean } | { ok: false; error: string },
): void {
  const now = new Date().toISOString();
  if (result.ok) {
    db.prepare("UPDATE monitors SET lastPolledAt=?, lastError=NULL, errorCount=0, state=?, baselined=? WHERE id=?").run(
      now, JSON.stringify(result.state), result.baselined ? 1 : 0, id,
    );
  } else {
    db.prepare("UPDATE monitors SET lastPolledAt=?, lastError=?, errorCount=errorCount+1 WHERE id=?").run(now, result.error, id);
  }
}

import { randomUUID } from "node:crypto";
import type { DB } from "./index.js";
import type { ChannelRow } from "../types.js";

export function create(db: DB, input: { name: string; notifierType: string; config: object }): ChannelRow {
  const row: ChannelRow = {
    id: randomUUID(),
    name: input.name,
    notifierType: input.notifierType,
    config: JSON.stringify(input.config),
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    "INSERT INTO channels (id,name,notifierType,config,createdAt) VALUES (@id,@name,@notifierType,@config,@createdAt)",
  ).run(row);
  return row;
}
export function list(db: DB): ChannelRow[] {
  return db.prepare("SELECT * FROM channels ORDER BY createdAt").all() as ChannelRow[];
}
export function get(db: DB, id: string): ChannelRow | undefined {
  return db.prepare("SELECT * FROM channels WHERE id=?").get(id) as ChannelRow | undefined;
}
export function update(db: DB, id: string, input: { name: string; config: object }): void {
  db.prepare("UPDATE channels SET name=?, config=? WHERE id=?").run(input.name, JSON.stringify(input.config), id);
}
export function remove(db: DB, id: string): void {
  db.prepare("DELETE FROM channels WHERE id=?").run(id);
}

import type { DB } from "../db/index.js";
import type { Registry } from "../plugins/registry.js";
import type { MonitorRow } from "../types.js";
import * as monitors from "../db/monitors.js";
import { runMonitor } from "./runner.js";
import { logger } from "../logger.js";

const BACKOFF_CAP = 16;

export function effectiveIntervalSec(m: MonitorRow): number {
  const factor = Math.min(2 ** m.errorCount, BACKOFF_CAP);
  return m.pollIntervalSec * factor;
}

export function isDue(m: MonitorRow, now: Date): boolean {
  if (!m.lastPolledAt) return true;
  const elapsed = (now.getTime() - new Date(m.lastPolledAt).getTime()) / 1000;
  return elapsed >= effectiveIntervalSec(m);
}

export class Scheduler {
  private timer?: NodeJS.Timeout;
  private inFlight = new Set<string>();

  constructor(private db: DB, private reg: Registry, private tickMs = 15_000, private now: () => Date = () => new Date()) {}

  start(): void {
    this.timer = setInterval(() => void this.tick(), this.tickMs);
    void this.tick();
    logger.info({ tickMs: this.tickMs }, "scheduler started");
  }
  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    const due = monitors.listEnabled(this.db).filter((m) => isDue(m, this.now()) && !this.inFlight.has(m.id));
    for (const m of due) {
      this.inFlight.add(m.id);
      runMonitor(this.db, this.reg, m.id).finally(() => this.inFlight.delete(m.id));
    }
  }
}

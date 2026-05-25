import type { DB } from "../db/index.js";
import type { Registry } from "../plugins/registry.js";
import * as monitors from "../db/monitors.js";
import * as channels from "../db/channels.js";
import * as events from "../db/events.js";
import * as alerts from "../db/alerts.js";
import { logger } from "../logger.js";
import type { MonitorEvent } from "../types.js";

const MAX_DELIVERY_ATTEMPTS = 3;
const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface RunOpts {
  sleep?: (ms: number) => Promise<void>;
}

export async function runMonitor(db: DB, reg: Registry, monitorId: string, opts: RunOpts = {}): Promise<void> {
  const sleep = opts.sleep ?? realSleep;
  const m = monitors.get(db, monitorId);
  if (!m) return;
  try {
    const source = reg.getSource(m.sourceType);
    const config = source.configSchema.parse(JSON.parse(m.config));
    const { events: found, state } = await source.check(config, JSON.parse(m.state));

    const wasBaselined = m.baselined === 1;
    for (const ev of found) {
      const eventId = events.recordIfNew(db, m.id, ev);
      if (eventId === null) continue; // already seen
      if (!wasBaselined) continue; // baseline seeding: record only, no alert
      await deliver(db, reg, m.id, m.channelId, m.name, eventId, ev, sleep);
    }
    monitors.markPolled(db, m.id, { ok: true, state, baselined: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ monitorId, err: msg }, "monitor poll failed");
    monitors.markPolled(db, m.id, { ok: false, error: msg });
  }
}

// Delivers one alert with bounded retry+backoff. Failures are logged but never
// thrown — a delivery failure must not fail the whole poll. The event is already
// recorded, so a permanent failure is visible in the alerts log but not re-attempted.
async function deliver(
  db: DB, reg: Registry, monitorId: string, channelId: string | null, monitorName: string,
  eventId: number, ev: MonitorEvent, sleep: (ms: number) => Promise<void>,
): Promise<void> {
  if (!channelId) {
    alerts.log(db, { monitorId, eventId, channelId: null, status: "no-channel", error: null });
    return;
  }
  const ch = channels.get(db, channelId);
  if (!ch) {
    alerts.log(db, { monitorId, eventId, channelId, status: "failed", error: "channel not found" });
    return;
  }
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt++) {
    try {
      const notifier = reg.getNotifier(ch.notifierType);
      await notifier.send(notifier.configSchema.parse(JSON.parse(ch.config)), { monitorName, event: ev });
      alerts.log(db, { monitorId, eventId, channelId, status: "sent", error: null });
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_DELIVERY_ATTEMPTS) await sleep(attempt * 500);
    }
  }
  logger.error({ monitorId, err: lastErr }, "alert delivery failed after retries");
  alerts.log(db, { monitorId, eventId, channelId, status: "failed", error: lastErr });
}

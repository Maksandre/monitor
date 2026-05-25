// ---------- icon maps ----------

const SOURCE_ICON_MAP: Record<string, string> = {
  "github-pull-requests": "github",
};

const NOTIFIER_ICON_MAP: Record<string, string> = {
  "telegram": "telegram",
};

export function sourceIcon(type: string): string {
  return SOURCE_ICON_MAP[type] ?? "circle";
}

export function notifierIcon(type: string): string {
  return NOTIFIER_ICON_MAP[type] ?? "circle";
}

// ---------- format helpers ----------

/** Normalize ts argument (epoch-ms number or ISO string) to epoch-ms number. */
function toMs(ts: number | string): number {
  return typeof ts === "number" ? ts : new Date(ts).getTime();
}

/**
 * Format a timestamp as a relative string ("just now", "5m ago", etc.).
 * Accepts epoch-ms numbers or ISO date strings; returns "—" for null.
 */
export function fmtRelative(ts: number | string | null): string {
  if (ts === null || ts === undefined) return "—";
  const ms = toMs(ts as number | string);
  if (isNaN(ms)) return "—";
  const diff = (Date.now() - ms) / 1000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Format a future timestamp as a countdown string ("42s", "2m 10s", etc.).
 * Accepts epoch-ms or null.
 */
export function fmtCountdown(ts: number | null): string {
  if (ts === null || ts === undefined) return "—";
  const diff = Math.max(0, (ts - Date.now()) / 1000);
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${Math.floor(diff % 60)}s`;
  return `${Math.floor(diff / 3600)}h`;
}

/**
 * Format a timestamp as a clock string ("HH:MM:SS").
 * Accepts epoch-ms numbers or ISO date strings.
 */
export function fmtClock(ts: number | string): string {
  return new Date(toMs(ts)).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format a timestamp as a date bucket label ("Today · Mon, Jan 1", etc.).
 * Accepts epoch-ms numbers or ISO date strings.
 */
export function fmtDateBucket(ts: number | string): string {
  const ms = toMs(ts);
  const dt = new Date(ms);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSame(dt, today))
    return "Today · " + dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  if (isSame(dt, yest))
    return "Yesterday · " + dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Return a stable string key for grouping timestamps into calendar days.
 * Accepts epoch-ms numbers or ISO date strings.
 */
export function bucketKey(ts: number | string): string {
  const dt = new Date(toMs(ts));
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}

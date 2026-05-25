import React, { useMemo, useState } from "react";
import type { AlertRow, Monitor, Channel } from "../api.js";
import { StatusDot, Stat, NotifierIcon } from "../components/ui.js";
import { fmtClock, fmtRelative, fmtDateBucket, bucketKey } from "../lib/format.js";

interface AlertsPageProps {
  alerts: AlertRow[];
  monitors: Monitor[];
  channels: Channel[];
}

interface FilterState {
  status: "all" | "sent" | "failed";
  monitorId: string; // "all" or a real id
}

interface DayGroup {
  key: string;
  label: string;
  items: AlertRow[];
}

export function AlertsPage({ alerts, monitors, channels }: AlertsPageProps) {
  const [filter, setFilter] = useState<FilterState>({ status: "all", monitorId: "all" });

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter.status !== "all" && a.status !== filter.status) return false;
      if (filter.monitorId !== "all" && a.monitorId !== filter.monitorId) return false;
      return true;
    });
  }, [alerts, filter]);

  const grouped = useMemo((): DayGroup[] => {
    const groups: DayGroup[] = [];
    let current: DayGroup | null = null;
    for (const a of filtered) {
      const key = bucketKey(a.sentAt);
      if (!current || current.key !== key) {
        current = { key, label: fmtDateBucket(a.sentAt), items: [] };
        groups.push(current);
      }
      current.items.push(a);
    }
    return groups;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: alerts.length,
    sent: alerts.filter((a) => a.status === "sent").length,
    failed: alerts.filter((a) => a.status === "failed").length,
    monitors: new Set(alerts.map((a) => a.monitorId)).size,
  }), [alerts]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Alerts</h1>
          <div className="page-sub">Every notification dispatched, in order.</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats">
        <Stat label="Total" icon="bell" value={stats.total} foot="all-time" />
        <Stat label="Sent" icon="check" value={stats.sent} foot="delivered ok" accent />
        <Stat label="Failed" icon="warn" value={stats.failed} foot={stats.failed ? "see error column" : "none"} />
        <Stat label="Monitors firing" icon="broadcast" value={stats.monitors} foot="distinct sources" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <select
          className="select"
          style={{ width: 140 }}
          value={filter.status}
          onChange={(e) => setFilter((s) => ({ ...s, status: e.target.value as FilterState["status"] }))}
        >
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <select
          className="select"
          style={{ width: 240 }}
          value={filter.monitorId}
          onChange={(e) => setFilter((s) => ({ ...s, monitorId: e.target.value }))}
        >
          <option value="all">All monitors</option>
          {monitors.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <span className="mono dim-2" style={{ marginLeft: "auto", fontSize: 11 }}>
          {filtered.length} alerts
        </span>
      </div>

      {/* Empty state */}
      {grouped.length === 0 && (
        <div className="empty">
          No alerts match the filter.
          <div className="empty-mono">$ alerts:tail --filter="…"</div>
        </div>
      )}

      {/* Grouped feed */}
      {grouped.map((g) => (
        <div key={g.key}>
          <div className="day-head">
            <span>{g.label}</span>
            <span className="mono dim-2" style={{ textTransform: "none" }}>
              · {g.items.length} alerts
            </span>
            <div className="line" />
          </div>

          {g.items.map((a) => {
            const monitorName =
              monitors.find((m) => m.id === a.monitorId)?.name ?? a.monitorId;
            const ch = channels.find((c) => c.id === a.channelId);

            return (
              <div key={a.id} className="alert">
                <StatusDot status={a.status === "sent" ? "ok" : "err"} />
                <span className="ts">{fmtClock(a.sentAt)}</span>
                <div style={{ minWidth: 0 }}>
                  {/* Primary line: monitor name */}
                  <div
                    className="mono"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--fg)",
                    }}
                  >
                    {monitorName}
                  </div>
                  {/* Secondary meta line */}
                  <div className="meta" style={{ marginTop: 2 }}>
                    <span className="src">{monitorName}</span>
                    <span style={{ margin: "0 6px", color: "var(--fg-3)" }}>→</span>
                    {ch ? (
                      <span>
                        <NotifierIcon type={ch.notifierType} size={10} /> {ch.name}
                      </span>
                    ) : (
                      "no channel"
                    )}
                    {a.error && (
                      <>
                        <span style={{ margin: "0 6px", color: "var(--fg-3)" }}>·</span>
                        <span style={{ color: "var(--err)" }}>{a.error}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

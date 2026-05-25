import React, { useMemo, useState } from "react";
import type { Monitor, Channel, AlertRow } from "../api.js";
import type { TestResult } from "../App.js";
import {
  Button, StatusDot, Pill, Switch, Countdown, Stat, NotifierIcon, SourceIcon, Icon,
} from "../components/ui.js";
import { fmtRelative } from "../lib/format.js";

// ---- Helpers ----
function statusOf(m: Monitor): { tone: string; label: string } {
  if (!m.enabled) return { tone: "muted", label: "disabled" };
  if (m.lastError) return { tone: "err", label: "errored" };
  if (!m.baselined) return { tone: "warn", label: "seeding" };
  return { tone: "ok", label: "ok" };
}

function deriveNextPollAt(m: Monitor): number | null {
  if (!m.enabled || !m.lastPolledAt) return null;
  return new Date(m.lastPolledAt).getTime() + m.pollIntervalSec * 1000;
}

// ---- Props ----
interface MonitorsPageProps {
  monitors: Monitor[];
  channels: Channel[];
  alerts: AlertRow[];
  testResults: Record<string, TestResult>;
  onOpenMonitor: (m: Monitor) => void;
  onNew: () => void;
  onToggle: (id: string, enabled: boolean) => void;
  onTest: (id: string) => void;
}

type FilterKey = "all" | "active" | "error" | "disabled";

// ---- Component ----
export function MonitorsPage({
  monitors,
  channels,
  alerts,
  testResults,
  onOpenMonitor,
  onNew,
  onToggle,
  onTest,
}: MonitorsPageProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(() => {
    return monitors.filter((m) => {
      if (filter === "active") return m.enabled && !m.lastError;
      if (filter === "error") return !!m.lastError;
      if (filter === "disabled") return !m.enabled;
      return true;
    });
  }, [monitors, filter]);

  const totals = useMemo(() => {
    const active = monitors.filter((m) => m.enabled).length;
    const erroring = monitors.filter((m) => m.enabled && !!m.lastError).length;
    const lastAlert = alerts[0] ?? null;
    const lastAlertMonitorName = lastAlert
      ? (monitors.find((m) => m.id === lastAlert.monitorId)?.name ?? lastAlert.monitorId)
      : "";
    return { active, erroring, lastAlert, lastAlertMonitorName };
  }, [monitors, alerts]);

  const filterCounts: Record<FilterKey, number> = {
    all: monitors.length,
    active: monitors.filter((m) => m.enabled && !m.lastError).length,
    error: monitors.filter((m) => !!m.lastError).length,
    disabled: monitors.filter((m) => !m.enabled).length,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Monitors</h1>
          <div className="page-sub">Polling sources for events you care about.</div>
        </div>
        <div className="page-head-actions">
          <Button variant="ghost" icon="refresh" size="sm">Sync now</Button>
          <Button variant="primary" icon="plus" onClick={onNew}>New monitor</Button>
        </div>
      </div>

      {/* Stats board */}
      <div className="stats">
        <Stat
          label="Active"
          icon="broadcast"
          value={totals.active}
          unit={`/ ${monitors.length}`}
          foot="watching for events"
        />
        <Stat
          label="Erroring"
          icon="warn"
          value={totals.erroring}
          foot={totals.erroring ? "exponential backoff active" : "all healthy"}
        />
        <Stat
          label="Alerts"
          icon="bell"
          value={alerts.length}
          accent
          foot="delivered"
        />
        <Stat
          label="Last alert"
          icon="bell"
          value={totals.lastAlert ? fmtRelative(totals.lastAlert.sentAt) : "—"}
          foot={totals.lastAlertMonitorName}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        {(["all", "active", "error", "disabled"] as FilterKey[]).map((f) => (
          <button
            key={f}
            className={`tab ${filter === f ? "active" : ""}`}
            style={{ borderBottom: 0, padding: "4px 10px", borderRadius: "var(--r-2)", height: 26 }}
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== "all" && (
              <span className="mono dim-2" style={{ marginLeft: 4, fontSize: 11 }}>
                {filterCounts[f]}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="filter" size={12} />
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {visible.length} of {monitors.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 16 }}></th>
            <th>Name</th>
            <th>Source</th>
            <th>Channel</th>
            <th style={{ width: 100 }}>Interval</th>
            <th style={{ width: 130 }}>Last poll</th>
            <th style={{ width: 130 }}>Next poll</th>
            <th style={{ width: 56 }}></th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((m) => {
            const ch = channels.find((c) => c.id === m.channelId);
            const st = statusOf(m);
            const nextPollAt = deriveNextPollAt(m);

            return (
              <tr
                key={m.id}
                className={!m.enabled ? "is-disabled" : ""}
                onClick={() => onOpenMonitor(m)}
              >
                <td>
                  <StatusDot status={st.tone} pulse={st.tone === "ok"} />
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="mono" style={{ color: "var(--fg)" }}>{m.name}</span>
                    {st.tone === "err" && (
                      <Pill tone="err" icon="warn">{m.errorCount} fail</Pill>
                    )}
                    {st.tone === "warn" && <Pill tone="warn">seeding</Pill>}
                  </div>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-1)" }}>
                    <SourceIcon type={m.sourceType} />
                    <span className="mono" style={{ fontSize: 12 }}>
                      {String(m.config.repo ?? "")}
                    </span>
                  </span>
                </td>
                <td>
                  {ch ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <NotifierIcon type={ch.notifierType} />
                      <span className="mono" style={{ fontSize: 12, color: "var(--fg-1)" }}>{ch.name}</span>
                    </span>
                  ) : (
                    <span className="mono dim-2">— none —</span>
                  )}
                </td>
                <td className="mono dim">{m.pollIntervalSec}s</td>
                <td className="mono dim">{fmtRelative(m.lastPolledAt)}</td>
                <td>
                  {!m.enabled ? (
                    <span className="mono dim-2">paused</span>
                  ) : !m.lastPolledAt ? (
                    <span className="mono dim">due</span>
                  ) : (
                    <Countdown
                      nextPollAt={nextPollAt}
                      intervalSec={m.pollIntervalSec}
                      enabled={m.enabled}
                    />
                  )}
                </td>
                <td>
                  <Switch
                    on={m.enabled}
                    onChange={(v) => {
                      onToggle(m.id, v);
                    }}
                  />
                </td>
                <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    iconOnly
                    icon="chevron-right"
                    size="sm"
                    onClick={() => onOpenMonitor(m)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Inline test results */}
      {Object.entries(testResults).map(([id, r]) => {
        const m = monitors.find((x) => x.id === id);
        if (!m || !r) return null;
        return (
          <div key={id} className="test-result" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Pill tone="info" icon="play">test</Pill>
              <span className="mono dim">{m.name}</span>
              <span className="dim-2 mono" style={{ marginLeft: "auto", fontSize: 11 }}>
                {r.events.length} match{r.events.length === 1 ? "" : "es"}
              </span>
            </div>
            {r.events.slice(0, 5).map((e, i) => (
              <div key={i}>· <span className="test-hit">{e.title}</span></div>
            ))}
            {r.events.length === 0 && (
              <div className="dim-2">no events matched right now</div>
            )}
          </div>
        );
      })}
    </>
  );
}

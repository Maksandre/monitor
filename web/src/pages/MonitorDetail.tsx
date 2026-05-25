import React, { useEffect, useState } from "react";
import { api, type Monitor, type Channel, type AlertRow } from "../api.js";
import type { TestResult } from "../App.js";
import {
  Button, StatusDot, Pill, Tag, Tabs, Icon,
} from "../components/ui.js";
import { fmtRelative, fmtCountdown } from "../lib/format.js";

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

interface MonitorDetailProps {
  monitor: Monitor;
  channels: Channel[];
  testResult?: TestResult;
  onEdit: (m: Monitor) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onTest: (id: string) => void;
}

type TabId = "alerts" | "config" | "test";

export function MonitorDetail({
  monitor,
  channels,
  testResult,
  onEdit,
  onDelete,
  onToggle,
  onTest,
}: MonitorDetailProps) {
  const [tab, setTab] = useState<TabId>("alerts");
  const [monitorAlerts, setMonitorAlerts] = useState<AlertRow[]>([]);
  const [testRunning, setTestRunning] = useState(false);

  const ch = channels.find((c) => c.id === monitor.channelId);
  const st = statusOf(monitor);
  const nextPollAt = deriveNextPollAt(monitor);

  // Fetch alerts on open / monitor change
  useEffect(() => {
    api.monitorAlerts(monitor.id).then(setMonitorAlerts).catch(() => {});
  }, [monitor.id]);

  async function runTest() {
    setTestRunning(true);
    try {
      await onTest(monitor.id);
    } finally {
      setTestRunning(false);
    }
  }

  // Config values
  const configLabels = monitor.config.labels as string[] | undefined;
  const configTriggerKinds = monitor.config.triggerKinds as string[] | undefined;
  const configRepo = monitor.config.repo as string | undefined;

  // "Open repo" button: only for github source type when repo is set
  const showOpenRepo = monitor.sourceType === "github-pull-requests" && !!configRepo;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <StatusDot status={st.tone} pulse={st.tone === "ok"} />
        <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{monitor.name}</span>
        <Pill tone={st.tone}>{st.label}</Pill>
      </div>

      {/* Meta */}
      <div className="mono dim" style={{ fontSize: 11.5, marginBottom: 18 }}>
        id <span style={{ color: "var(--fg-2)" }}>{monitor.id}</span>
        <span style={{ margin: "0 8px" }}>·</span>
        {monitor.sourceType}
        <span style={{ margin: "0 8px" }}>·</span>
        every {monitor.pollIntervalSec}s
        <span style={{ margin: "0 8px" }}>·</span>
        last polled {fmtRelative(monitor.lastPolledAt)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        <Button
          icon={monitor.enabled ? "pause" : "play"}
          onClick={() => onToggle(monitor.id, !monitor.enabled)}
        >
          {monitor.enabled ? "Pause" : "Resume"}
        </Button>
        <Button icon="play" onClick={runTest} disabled={testRunning}>
          Run test
        </Button>
        <Button icon="edit" onClick={() => onEdit(monitor)}>Edit</Button>
        {showOpenRepo && (
          <Button
            variant="ghost"
            icon="external"
            onClick={() => window.open(`https://github.com/${configRepo}`, "_blank", "noreferrer")}
          >
            Open repo
          </Button>
        )}
        <Button
          variant="danger"
          icon="trash"
          onClick={() => onDelete(monitor.id)}
          title="Delete monitor"
        >
          Delete
        </Button>
      </div>

      {/* Error callout */}
      {monitor.lastError && (
        <div className="panel" style={{ marginBottom: 14, borderColor: "oklch(0.66 0.22 25 / 0.5)" }}>
          <div className="panel-body" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "var(--err)", marginTop: 2 }}><Icon name="warn" /></span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--err)", fontWeight: 600, marginBottom: 2 }}>Last poll failed</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--fg-1)" }}>{monitor.lastError}</div>
              <div className="mono dim-2" style={{ fontSize: 11, marginTop: 4 }}>
                {monitor.errorCount} consecutive failures · backing off → next attempt{" "}
                {fmtCountdown(nextPollAt)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: "alerts", label: `Recent alerts · ${monitorAlerts.length}` },
          { id: "config", label: "Config" },
          { id: "test", label: "Test" },
        ]}
      />

      {/* Recent alerts tab */}
      {tab === "alerts" && (
        <div className="panel">
          {monitorAlerts.length === 0 ? (
            <div className="empty" style={{ border: 0, margin: 0 }}>
              No alerts for this monitor.
              <div className="empty-mono">$ monitor:alerts --monitor={monitor.id}</div>
            </div>
          ) : (
            monitorAlerts.map((a) => (
              <div key={a.id} className="event">
                <span className="ts">{fmtRelative(a.sentAt)}</span>
                <span className={`kind ${a.status === "sent" ? "ok" : "err"}`}>
                  {a.status}
                </span>
                <span className="title" style={{ color: a.status === "sent" ? undefined : "var(--err)" }}>
                  {a.error ?? "delivered"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Config tab */}
      {tab === "config" && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Source · {monitor.sourceType}</span>
          </div>
          <div className="panel-body">
            <dl className="kv">
              <dt>repo</dt>
              <dd>{configRepo || <span className="dim-2">—</span>}</dd>

              <dt>title contains</dt>
              <dd>
                {String(monitor.config.titleMatch ?? "") || <span className="dim-2">—</span>}
              </dd>

              <dt>exclude</dt>
              <dd>
                {String(monitor.config.excludeMatch ?? "") || <span className="dim-2">—</span>}
              </dd>

              <dt>labels</dt>
              <dd>
                {configLabels?.length
                  ? configLabels.map((l) => <Tag key={l}>{l}</Tag>)
                  : <span className="dim-2">none</span>}
              </dd>

              <dt>trigger on</dt>
              <dd>
                {configTriggerKinds?.length
                  ? configTriggerKinds.map((k) => <Tag key={k}>{k}</Tag>)
                  : <span className="dim-2">—</span>}
              </dd>

              <dt>poll interval</dt>
              <dd>{monitor.pollIntervalSec}s</dd>

              <dt>channel</dt>
              <dd>
                {ch
                  ? `${ch.name} (${ch.notifierType})`
                  : <span className="dim-2">— none —</span>}
              </dd>

              <dt>baselined</dt>
              <dd>{monitor.baselined ? "yes" : "no (next poll seeds silently)"}</dd>
            </dl>
          </div>
        </div>
      )}

      {/* Test tab */}
      {tab === "test" && (
        <div className="panel">
          <div className="panel-body">
            <p className="dim" style={{ marginTop: 0 }}>
              Run the source check once against current state. Doesn't deliver alerts.
            </p>
            <Button variant="accent" icon="play" onClick={runTest} disabled={testRunning}>
              Run check
            </Button>
            {testResult && (
              <div className="test-result" style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <span className="dim">→ </span>
                  {testResult.events.length} event{testResult.events.length === 1 ? "" : "s"} matched
                </div>
                {testResult.events.map((e, i) => (
                  <div key={i}>· <span className="test-hit">{e.title}</span></div>
                ))}
                {testResult.events.length === 0 && (
                  <div className="dim-2">no events matched right now</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

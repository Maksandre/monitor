import React, { useState, useEffect, useMemo } from "react";
import { api, type Monitor, type Channel, type AlertRow, type PluginType } from "./api.js";
import { Icon, Button, StatusDot, Drawer } from "./components/ui.js";
import { useTweaks, Tweaks } from "./components/Tweaks.js";
import { MonitorsPage } from "./pages/Monitors.js";
import { MonitorDetail } from "./pages/MonitorDetail.js";
import { MonitorForm } from "./pages/MonitorForm.js";
import { ChannelsPage } from "./pages/Channels.js";
import { AlertsPage } from "./pages/Alerts.js";

// ---- Route type ----
type Page = "monitors" | "channels" | "alerts";
type Modal = "new" | "edit" | null;

interface Route {
  page: Page;
  modal?: Modal;
  monitor?: Monitor;
}

// ---- Test result type ----
export interface TestResult {
  events: { dedupeKey: string; title: string; url: string }[];
  at: number;
}

// ---- App ----
export function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [sourceTypes, setSourceTypes] = useState<PluginType[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const [route, setRoute] = useState<Route>({ page: "monitors" });
  const [openMonitorId, setOpenMonitorId] = useState<string | null>(null);

  const [tweaks, setTweak] = useTweaks();

  // ---- Initial loads ----
  function reloadMonitors() { api.monitors().then(setMonitors).catch(() => {}); }
  function reloadChannels() { api.channels().then(setChannels).catch(() => {}); }
  function reloadAlerts() { api.alerts().then(setAlerts).catch(() => {}); }

  useEffect(() => {
    reloadMonitors();
    reloadChannels();
    reloadAlerts();
    api.sourceTypes().then(setSourceTypes).catch(() => {});
  }, []);

  // ---- Mutations ----
  async function toggleMonitor(id: string, enabled: boolean) {
    await api.toggleMonitor(id, enabled);
    reloadMonitors();
  }

  async function deleteMonitor(id: string) {
    await api.deleteMonitor(id);
    setOpenMonitorId(null);
    reloadMonitors();
  }

  async function saveMonitor(payload: { name: string; sourceType: string; config: Record<string, unknown>; channelId: string | null; pollIntervalSec: number }, editingMonitor?: Monitor) {
    if (editingMonitor) {
      await api.updateMonitor(editingMonitor.id, payload);
    } else {
      await api.createMonitor(payload);
    }
    reloadMonitors();
    setRoute({ page: "monitors" });
  }

  async function createChannel(payload: { name: string; notifierType: string; config: Record<string, unknown> }) {
    await api.createChannel(payload);
    reloadChannels();
  }

  async function deleteChannel(id: string) {
    await api.deleteChannel(id);
    reloadChannels();
  }

  async function testMonitor(id: string) {
    const r = await api.testMonitor(id);
    setTestResults((prev) => ({ ...prev, [id]: { events: r.events, at: Date.now() } }));
  }

  // ---- Derived: live open monitor ----
  const liveOpenMonitor = openMonitorId
    ? monitors.find((m) => m.id === openMonitorId) ?? null
    : null;

  // ---- Sidebar counts ----
  const enabledCount = useMemo(() => monitors.filter((m) => m.enabled).length, [monitors]);

  // ---- View routing ----
  let view: React.ReactNode;
  if (route.page === "monitors" && route.modal === "new") {
    view = (
      <MonitorForm
        monitor={null}
        channels={channels}
        sourceTypes={sourceTypes}
        onCancel={() => setRoute({ page: "monitors" })}
        onSave={saveMonitor}
      />
    );
  } else if (route.page === "monitors" && route.modal === "edit" && route.monitor) {
    view = (
      <MonitorForm
        monitor={route.monitor}
        channels={channels}
        sourceTypes={sourceTypes}
        onCancel={() => setRoute({ page: "monitors" })}
        onSave={saveMonitor}
      />
    );
  } else if (route.page === "monitors") {
    view = (
      <MonitorsPage
        monitors={monitors}
        channels={channels}
        alerts={alerts}
        testResults={testResults}
        onOpenMonitor={(m) => setOpenMonitorId(m.id)}
        onNew={() => setRoute({ page: "monitors", modal: "new" })}
        onToggle={toggleMonitor}
        onTest={testMonitor}
      />
    );
  } else if (route.page === "channels") {
    view = (
      <ChannelsPage
        channels={channels}
        onCreate={createChannel}
        onDelete={deleteChannel}
      />
    );
  } else if (route.page === "alerts") {
    view = (
      <AlertsPage
        alerts={alerts}
        monitors={monitors}
        channels={channels}
      />
    );
  }

  return (
    <div className="shell">
      <Sidebar
        route={route}
        setRoute={setRoute}
        monitors={monitors}
        channels={channels}
        alerts={alerts}
        sourceTypes={sourceTypes}
        enabledCount={enabledCount}
      />
      <div className="main">
        <Topbar route={route} />
        <div className="content">{view}</div>
      </div>

      <Drawer
        open={!!liveOpenMonitor}
        onClose={() => setOpenMonitorId(null)}
        title={
          liveOpenMonitor
            ? (
              <>
                <span className="dim">monitor</span>{" "}
                <span style={{ color: "var(--fg)" }}>/ {liveOpenMonitor.name}</span>
              </>
            )
            : ""
        }
      >
        {liveOpenMonitor && (
          <MonitorDetail
            monitor={liveOpenMonitor}
            channels={channels}
            testResult={testResults[liveOpenMonitor.id]}
            onEdit={(m) => {
              setOpenMonitorId(null);
              setRoute({ page: "monitors", modal: "edit", monitor: m });
            }}
            onDelete={(id) => {
              if (confirm("Delete this monitor?")) deleteMonitor(id);
            }}
            onToggle={toggleMonitor}
            onTest={testMonitor}
          />
        )}
      </Drawer>

      <Tweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

// ---- Sidebar ----
interface SidebarProps {
  route: Route;
  setRoute: (r: Route) => void;
  monitors: Monitor[];
  channels: Channel[];
  alerts: AlertRow[];
  sourceTypes: PluginType[];
  enabledCount: number;
}

function Sidebar({ route, setRoute, monitors, channels, alerts, sourceTypes, enabledCount }: SidebarProps) {
  const navItems: { id: Page; label: string; icon: string; count: number }[] = [
    { id: "monitors", label: "Monitors", icon: "broadcast", count: monitors.length },
    { id: "channels", label: "Channels", icon: "bell", count: channels.length },
    { id: "alerts", label: "Alerts", icon: "activity", count: alerts.length },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-name">monitor</div>
      </div>

      <div className="nav-section">Workspace</div>
      <div className="nav">
        {navItems.map((it) => (
          <button
            key={it.id}
            className={`nav-item ${route.page === it.id ? "active" : ""}`}
            onClick={() => setRoute({ page: it.id })}
          >
            <span className="nav-icon"><Icon name={it.icon} /></span>
            {it.label}
            <span className="nav-count">{it.count}</span>
          </button>
        ))}
      </div>

      <div className="nav-section">Sources</div>
      <div className="nav">
        {sourceTypes.map((st) => (
          <button key={st.type} className="nav-item">
            <span className="nav-icon"><Icon name={st.type === "github-pull-requests" ? "github" : "circle"} /></span>
            {st.displayName}
            <span className="nav-count">{monitors.filter((m) => m.sourceType === st.type).length}</span>
          </button>
        ))}
        {sourceTypes.length === 0 && (
          <button className="nav-item">
            <span className="nav-icon"><Icon name="github" /></span>
            GitHub Pull Requests
            <span className="nav-count">{monitors.length}</span>
          </button>
        )}
        <button className="nav-item dim" title="Coming soon">
          <span className="nav-icon"><Icon name="plus" /></span>
          <span className="dim">Add source plugin…</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="row">
          <span>service</span>
          <span style={{ color: "var(--ok)" }}>● running</span>
        </div>
        <div className="row">
          <span>scheduler</span>
          <span style={{ color: "var(--fg-1)" }}>{enabledCount} active</span>
        </div>
        <div className="row">
          <span>port</span>
          <span style={{ color: "var(--fg-1)" }}>:8473</span>
        </div>
      </div>
    </aside>
  );
}

// ---- Topbar ----
interface TopbarProps {
  route: Route;
}

function Topbar({ route }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="crumbs">
        <span>monitor.local</span>
        <span className="sep">/</span>
        <span className="here">{route.page}</span>
        {route.modal === "new" && (
          <>
            <span className="sep">/</span>
            <span className="here">new</span>
          </>
        )}
        {route.modal === "edit" && (
          <>
            <span className="sep">/</span>
            <span className="here">edit</span>
          </>
        )}
      </div>

      <div className="topbar-actions">
        <span className="live">
          <StatusDot status="ok" pulse /> scheduler · live
        </span>
        <Button variant="ghost" iconOnly icon="search" size="sm" title="Search (⌘K)" />
      </div>
    </header>
  );
}

import React, { useState } from "react";
import { Monitors } from "./pages/Monitors.js";
import { MonitorForm } from "./pages/MonitorForm.js";
import type { Monitor } from "./api.js";

type Tab = "monitors" | "channels" | "alerts";

export function App() {
  const [tab, setTab] = useState<Tab>("monitors");
  const [editing, setEditing] = useState<Monitor | "new" | null>(null);

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>Monitor</h1>
      <nav style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["monitors", "channels", "alerts"] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setEditing(null); }} style={{ fontWeight: tab === t ? "bold" : "normal" }}>{t}</button>
        ))}
      </nav>
      {tab === "monitors" && !editing && <Monitors onNew={() => setEditing("new")} onEdit={setEditing} />}
      {tab === "monitors" && editing && <MonitorForm monitor={editing} onDone={() => setEditing(null)} />}
      {tab === "channels" && <div>channels</div>}
      {tab === "alerts" && <div>alerts</div>}
    </div>
  );
}

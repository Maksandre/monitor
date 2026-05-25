import React, { useState } from "react";

type Tab = "monitors" | "channels" | "alerts";

export function App() {
  const [tab, setTab] = useState<Tab>("monitors");
  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>Monitor</h1>
      <nav style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["monitors", "channels", "alerts"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ fontWeight: tab === t ? "bold" : "normal" }}>{t}</button>
        ))}
      </nav>
      {tab === "monitors" && <div>monitors</div>}
      {tab === "channels" && <div>channels</div>}
      {tab === "alerts" && <div>alerts</div>}
    </div>
  );
}

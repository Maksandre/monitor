import React, { useEffect, useState } from "react";
import { api, type Monitor } from "../api.js";

export function Monitors({ onEdit, onNew }: { onEdit: (m: Monitor) => void; onNew: () => void }) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const reload = () => api.monitors().then(setMonitors);
  useEffect(() => { reload(); }, []);

  async function test(id: string) {
    const r = await api.testMonitor(id);
    setTestResult((s) => ({ ...s, [id]: `${r.events.length} match(es): ${r.events.map((e) => e.title).join("; ") || "none"}` }));
  }

  return (
    <div>
      <button onClick={onNew}>+ New monitor</button>
      <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
        <thead><tr><th align="left">Name</th><th>Type</th><th>Enabled</th><th>Last poll</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {monitors.map((m) => (
            <tr key={m.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{m.name}</td>
              <td>{m.sourceType}</td>
              <td align="center">
                <input type="checkbox" checked={m.enabled} onChange={(e) => api.toggleMonitor(m.id, e.target.checked).then(reload)} />
              </td>
              <td align="center">{m.lastPolledAt ? new Date(m.lastPolledAt).toLocaleString() : "—"}</td>
              <td style={{ color: m.lastError ? "crimson" : "green" }}>{m.lastError ?? (m.baselined ? "ok" : "seeding")}</td>
              <td align="right">
                <button onClick={() => test(m.id)}>Test</button>{" "}
                <button onClick={() => onEdit(m)}>Edit</button>{" "}
                <button onClick={() => confirm("Delete?") && api.deleteMonitor(m.id).then(reload)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {monitors.map((m) => testResult[m.id] && <p key={m.id} style={{ fontSize: 13 }}><b>{m.name}:</b> {testResult[m.id]}</p>)}
    </div>
  );
}

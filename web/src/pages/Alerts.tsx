import React, { useEffect, useState } from "react";
import { api, type AlertRow } from "../api.js";

export function Alerts() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  useEffect(() => { api.alerts().then(setAlerts); }, []);
  return (
    <div>
      <h3>Recent alerts</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th align="left">Time</th><th>Status</th><th align="left">Error</th></tr></thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{new Date(a.sentAt).toLocaleString()}</td>
              <td align="center" style={{ color: a.status === "sent" ? "green" : "crimson" }}>{a.status}</td>
              <td>{a.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {alerts.length === 0 && <p>No alerts yet.</p>}
    </div>
  );
}

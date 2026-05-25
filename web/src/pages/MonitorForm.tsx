import React, { useEffect, useState } from "react";
import { api, type Monitor, type PluginType, type Channel } from "../api.js";
import { FieldInput } from "../FieldInput.js";

export function MonitorForm({ monitor, onDone }: { monitor: Monitor | "new"; onDone: () => void }) {
  const isNew = monitor === "new";
  const [sourceTypes, setSourceTypes] = useState<PluginType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [name, setName] = useState(isNew ? "" : monitor.name);
  const [sourceType, setSourceType] = useState(isNew ? "" : monitor.sourceType);
  const [config, setConfig] = useState<Record<string, unknown>>(isNew ? {} : monitor.config);
  const [channelId, setChannelId] = useState<string | null>(isNew ? null : monitor.channelId);
  const [pollIntervalSec, setPoll] = useState(isNew ? 120 : monitor.pollIntervalSec);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.sourceTypes().then(setSourceTypes); api.channels().then(setChannels); }, []);
  const selected = sourceTypes.find((s) => s.type === sourceType);

  function pickSource(type: string) {
    setSourceType(type);
    const st = sourceTypes.find((s) => s.type === type);
    if (st && isNew) setConfig(Object.fromEntries(st.fields.map((f) => [f.name, f.default ?? ""])));
  }

  async function save() {
    try {
      const payload = { name, sourceType, config, channelId, pollIntervalSec };
      if (isNew) await api.createMonitor(payload);
      else await api.updateMonitor(monitor.id, payload);
      onDone();
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <div>
      <h3>{isNew ? "New monitor" : `Edit ${monitor.name}`}</h3>
      <div style={{ marginBottom: 10 }}><label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div style={{ marginBottom: 10 }}><label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>Source type *</label>
        <select value={sourceType} onChange={(e) => pickSource(e.target.value)} disabled={!isNew}>
          <option value="">— select —</option>
          {sourceTypes.map((s) => <option key={s.type} value={s.type}>{s.displayName}</option>)}
        </select></div>
      {selected?.fields.map((f) => (
        <FieldInput key={f.name} field={f} value={config[f.name]} onChange={(v) => setConfig((c) => ({ ...c, [f.name]: v }))} />
      ))}
      <div style={{ marginBottom: 10 }}><label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>Channel</label>
        <select value={channelId ?? ""} onChange={(e) => setChannelId(e.target.value || null)}>
          <option value="">— none —</option>
          {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></div>
      <div style={{ marginBottom: 10 }}><label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>Poll interval (sec)</label>
        <input type="number" value={pollIntervalSec} onChange={(e) => setPoll(Number(e.target.value))} /></div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button onClick={save}>Save</button> <button onClick={onDone}>Cancel</button>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { api, type Channel, type PluginType } from "../api.js";
import { FieldInput } from "../FieldInput.js";

export function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [types, setTypes] = useState<PluginType[]>([]);
  const [name, setName] = useState("");
  const [notifierType, setNotifierType] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const reload = () => api.channels().then(setChannels);
  useEffect(() => { reload(); api.notifierTypes().then(setTypes); }, []);
  const selected = types.find((t) => t.type === notifierType);

  async function add() {
    try { await api.createChannel({ name, notifierType, config }); setName(""); setConfig({}); setNotifierType(""); reload(); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <div>
      <h3>Channels</h3>
      <ul>{channels.map((c) => (
        <li key={c.id}>{c.name} ({c.notifierType}) <button onClick={() => api.deleteChannel(c.id).then(reload)}>delete</button></li>
      ))}</ul>
      <h4>Add channel</h4>
      <div style={{ marginBottom: 10 }}><input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <select value={notifierType} onChange={(e) => { setNotifierType(e.target.value); setConfig({}); }}>
        <option value="">— type —</option>
        {types.map((t) => <option key={t.type} value={t.type}>{t.displayName}</option>)}
      </select>
      {selected?.fields.map((f) => (
        <FieldInput key={f.name} field={f} value={config[f.name]} onChange={(v) => setConfig((c) => ({ ...c, [f.name]: v }))} />
      ))}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button onClick={add} disabled={!notifierType || !name}>Add</button>
    </div>
  );
}

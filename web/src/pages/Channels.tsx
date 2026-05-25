import React, { useEffect, useState } from "react";
import { api, type Channel, type PluginType } from "../api.js";
import { Button, NotifierIcon, Field } from "../components/ui.js";

interface ChannelsPageProps {
  channels: Channel[];
  onCreate: (payload: { name: string; notifierType: string; config: Record<string, unknown> }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ChannelsPage({ channels, onCreate, onDelete }: ChannelsPageProps) {
  const [notifierTypes, setNotifierTypes] = useState<PluginType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [notifierType, setNotifierType] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.notifierTypes().then((types) => {
      setNotifierTypes(types);
      if (types.length > 0 && !notifierType) {
        const first = types[0];
        setNotifierType(first.type);
        setConfig(Object.fromEntries(first.fields.map((f) => [f.name, f.default ?? ""])));
      }
    }).catch(() => {});
  }, []);

  const def = notifierTypes.find((t) => t.type === notifierType);

  function pickNotifier(type: string) {
    setNotifierType(type);
    const d = notifierTypes.find((t) => t.type === type);
    setConfig(d ? Object.fromEntries(d.fields.map((f) => [f.name, f.default ?? ""])) : {});
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await onCreate({ name, notifierType, config });
      setName("");
      setConfig(def ? Object.fromEntries(def.fields.map((f) => [f.name, f.default ?? ""])) : {});
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Channels</h1>
          <div className="page-sub">Where alerts get delivered.</div>
        </div>
        <div className="page-head-actions">
          <Button variant="primary" icon="plus" onClick={() => setShowForm((s) => !s)}>
            New channel
          </Button>
        </div>
      </div>

      <table className="table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Notifier</th>
            <th>Config</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => (
            <tr key={c.id}>
              <td><NotifierIcon type={c.notifierType} /></td>
              <td>
                <span className="mono" style={{ color: "var(--fg)" }}>{c.name}</span>
              </td>
              <td className="mono dim">{c.notifierType}</td>
              <td className="mono dim">
                {c.notifierType === "telegram" && (
                  <>chat <span style={{ color: "var(--fg-1)" }}>{String(c.config.chatId ?? "")}</span></>
                )}
              </td>
              <td className="col-actions">
                <Button
                  variant="ghost"
                  iconOnly
                  icon="trash"
                  size="sm"
                  onClick={() => onDelete(c.id)}
                  title="Delete channel"
                />
              </td>
            </tr>
          ))}
          {channels.length === 0 && (
            <tr>
              <td colSpan={5}>
                <div className="empty">
                  No channels yet.
                  <div className="empty-mono">$ channels:add --notifier=telegram</div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">New channel</span>
            <Button variant="ghost" iconOnly icon="close" size="sm" onClick={() => setShowForm(false)} />
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <div className="field">
                <label className="field-label">Name<span className="req">*</span></label>
                <div>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. team-releases"
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Notifier<span className="req">*</span></label>
                <div>
                  <select
                    className="select"
                    value={notifierType}
                    onChange={(e) => pickNotifier(e.target.value)}
                  >
                    {notifierTypes.map((t) => (
                      <option key={t.type} value={t.type}>{t.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
              {def && def.fields.map((f) => (
                <Field
                  key={f.name}
                  field={f}
                  value={config[f.name]}
                  onChange={(v) => setConfig((c) => ({ ...c, [f.name]: v }))}
                />
              ))}
            </div>

            {error && (
              <div style={{ color: "var(--err)", fontSize: 13, marginTop: 8 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
              <Button
                variant="primary"
                icon="check"
                onClick={submit}
                disabled={!name || !notifierType || saving}
              >
                Create channel
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

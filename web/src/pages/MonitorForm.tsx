import React, { useState } from "react";
import type { Monitor, Channel, PluginType } from "../api.js";
import { Button, Field, SourceIcon } from "../components/ui.js";

interface MonitorFormProps {
  monitor: Monitor | null; // null = new
  channels: Channel[];
  sourceTypes: PluginType[];
  onCancel: () => void;
  onSave: (
    payload: { name: string; sourceType: string; config: Record<string, unknown>; channelId: string | null; pollIntervalSec: number },
    editingMonitor?: Monitor
  ) => Promise<void>;
}

export function MonitorForm({ monitor, channels, sourceTypes, onCancel, onSave }: MonitorFormProps) {
  const isNew = monitor === null;

  const defaultSourceType = isNew
    ? (sourceTypes[0]?.type ?? "")
    : monitor.sourceType;

  const [name, setName] = useState(isNew ? "" : monitor.name);
  const [sourceType, setSourceType] = useState(defaultSourceType);
  const [channelId, setChannelId] = useState<string | null>(
    isNew ? (channels[0]?.id ?? null) : monitor.channelId
  );
  const [pollIntervalSec, setPoll] = useState(isNew ? 120 : monitor.pollIntervalSec);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sourceDef = sourceTypes.find((s) => s.type === sourceType);

  // Initialise config from field defaults (new) or monitor.config (edit)
  function defaultConfig(st: string): Record<string, unknown> {
    const def = sourceTypes.find((s) => s.type === st);
    if (!def) return {};
    return Object.fromEntries(def.fields.map((f) => [f.name, f.default ?? ""]));
  }

  const [config, setConfig] = useState<Record<string, unknown>>(
    isNew ? defaultConfig(defaultSourceType) : monitor.config
  );

  function pickSource(type: string) {
    setSourceType(type);
    if (isNew) setConfig(defaultConfig(type));
  }

  function setConfigField(name: string, val: unknown) {
    setConfig((c) => ({ ...c, [name]: val }));
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await onSave(
        { name, sourceType, config, channelId, pollIntervalSec },
        isNew ? undefined : monitor
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {isNew ? "Create monitor" : "Edit monitor"}
      </div>
      <h2 className="page-title" style={{ marginBottom: 24 }}>
        {isNew ? "New monitor" : <span className="mono">{monitor.name}</span>}
      </h2>

      {/* Basics panel */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Basics</span>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label className="field-label">
                Name<span className="req">*</span>
              </label>
              <div>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. acme-app releases"
                />
                <div className="field-help">A short, descriptive label. Shows in alerts.</div>
              </div>
            </div>
            <div className="field">
              <label className="field-label">
                Source type<span className="req">*</span>
              </label>
              <div>
                <select
                  className="select"
                  value={sourceType}
                  onChange={(e) => pickSource(e.target.value)}
                  disabled={!isNew}
                >
                  {sourceTypes.map((s) => (
                    <option key={s.type} value={s.type}>{s.displayName}</option>
                  ))}
                </select>
                <div className="field-help">Locked after creation to keep config valid.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source config panel */}
      {sourceDef && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">{sourceDef.displayName} · config</span>
            <span style={{ marginLeft: "auto" }}>
              <SourceIcon type={sourceType} />
            </span>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              {sourceDef.fields.map((f) => (
                <Field
                  key={f.name}
                  field={f}
                  value={config[f.name]}
                  onChange={(v) => setConfigField(f.name, v)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delivery panel */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Delivery</span>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label className="field-label">Channel</label>
              <div>
                <select
                  className="select"
                  value={channelId ?? ""}
                  onChange={(e) => setChannelId(e.target.value || null)}
                >
                  <option value="">— none (silent) —</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.notifierType})
                    </option>
                  ))}
                </select>
                <div className="field-help">
                  Matched events fan out to this channel. Leave empty to log without alerting.
                </div>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Poll interval</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="input"
                  style={{ width: 100 }}
                  type="number"
                  min="30"
                  value={pollIntervalSec}
                  onChange={(e) => setPoll(Number(e.target.value))}
                />
                <span className="mono dim">
                  seconds · {Math.round((pollIntervalSec / 60) * 10) / 10}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="panel" style={{ borderColor: "oklch(0.66 0.22 25 / 0.5)", marginBottom: 8 }}>
          <div className="panel-body" style={{ color: "var(--err)", fontSize: 13 }}>
            {error}
          </div>
        </div>
      )}

      {/* Form actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
        <Button
          variant="primary"
          icon="check"
          onClick={save}
          disabled={!name || saving}
        >
          {isNew ? "Create monitor" : "Save changes"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        {isNew && (
          <span
            className="mono dim-2"
            style={{ marginLeft: "auto", alignSelf: "center", fontSize: 11 }}
          >
            first poll runs immediately, seeds baseline silently
          </span>
        )}
      </div>
    </div>
  );
}

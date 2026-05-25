import React, { useState, useEffect } from "react";
import type { FieldDescriptor } from "../api.js";
import { fmtCountdown, sourceIcon, notifierIcon } from "../lib/format.js";

// ---------- Icon ----------

interface IconProps {
  name: string;
  size?: number;
}

export function Icon({ name, size = 14 }: IconProps): React.ReactElement | null {
  const common: React.SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "activity":
      return <svg {...common}><path d="M1 8h3l2-5 3 10 2-5h4" /></svg>;
    case "broadcast":
      return <svg {...common}><circle cx="8" cy="8" r="1.5" /><path d="M4.5 11.5a5 5 0 010-7M11.5 4.5a5 5 0 010 7M2.5 13.5a8 8 0 010-11M13.5 2.5a8 8 0 010 11" /></svg>;
    case "bell":
      return <svg {...common}><path d="M3.5 11.5h9l-1-1.5V7a3.5 3.5 0 10-7 0v3l-1 1.5z" /><path d="M6.5 13.5a1.5 1.5 0 003 0" /></svg>;
    case "plus":
      return <svg {...common}><path d="M8 3v10M3 8h10" /></svg>;
    case "search":
      return <svg {...common}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="8" cy="8" r="1.5" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" /></svg>;
    case "chevron-right":
      return <svg {...common}><path d="M6 3l4 5-4 5" /></svg>;
    case "chevron-down":
      return <svg {...common}><path d="M3 6l5 4 5-4" /></svg>;
    case "close":
      return <svg {...common}><path d="M3 3l10 10M13 3L3 13" /></svg>;
    case "external":
      return <svg {...common}><path d="M9 3h4v4M13 3L7 9M7 4H3v9h9V9" /></svg>;
    case "play":
      return <svg {...common}><path d="M4 3l9 5-9 5z" fill="currentColor" stroke="none" /></svg>;
    case "pause":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="3" height="10" fill="currentColor" stroke="none" />
          <rect x="9" y="3" width="3" height="10" fill="currentColor" stroke="none" />
        </svg>
      );
    case "edit":
      return <svg {...common}><path d="M11.5 2.5l2 2-7.5 7.5H4v-2L11.5 2.5z" /></svg>;
    case "trash":
      return <svg {...common}><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5l.5 8h5L11 4.5" /></svg>;
    case "github":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M8 0a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.37-.93-.9-1.18-.9-1.18-.73-.5.06-.49.06-.49.81.06 1.24.83 1.24.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.96 0-.88.31-1.6.83-2.16-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.52.56.82 1.28.82 2.16 0 3.09-1.87 3.76-3.65 3.96.29.25.55.73.55 1.48v2.19c0 .21.15.46.55.38A8 8 0 008 0z" />
        </svg>
      );
    case "telegram":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
          <path d="M14.6 1.7L1.4 6.8c-.7.3-.7.7-.1.9l3.3 1 7.6-4.8c.4-.2.7-.1.4.2L6.5 9.5l-.2 3.4c.3 0 .4-.1.6-.3l1.5-1.5 3.2 2.4c.6.3 1 .2 1.2-.5l2.1-9.9c.2-1-.3-1.4-1.3-.9z" />
        </svg>
      );
    case "filter":
      return <svg {...common}><path d="M2 3h12l-4.5 6V13l-3 1V9L2 3z" /></svg>;
    case "moon":
      return <svg {...common}><path d="M13 9.5A5 5 0 016.5 3a5 5 0 100 10A5 5 0 0013 9.5z" /></svg>;
    case "sun":
      return <svg {...common}><circle cx="8" cy="8" r="2.5" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M2.5 8a5.5 5.5 0 019.4-3.9M13.5 8a5.5 5.5 0 01-9.4 3.9M11.5 1.5V5h-3.5M4.5 14.5V11h3.5" /></svg>;
    case "check":
      return <svg {...common}><path d="M3 8.5l3 3 7-7" /></svg>;
    case "warn":
      return <svg {...common}><path d="M8 2L1.5 13.5h13L8 2z" /><path d="M8 6v3M8 11v.5" /></svg>;
    case "circle":
      return <svg {...common}><circle cx="8" cy="8" r="5" /></svg>;
    case "tag":
      return <svg {...common}><path d="M2 8V2h6l6 6-6 6-6-6z" /><circle cx="5" cy="5" r="0.5" fill="currentColor" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2 2" /></svg>;
    default:
      return null;
  }
}

// ---------- Button ----------

interface ButtonProps {
  children?: React.ReactNode;
  variant?: "default" | "primary" | "accent" | "ghost" | "danger";
  size?: "sm";
  icon?: string;
  iconOnly?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "default",
  size,
  icon,
  iconOnly,
  onClick,
  disabled,
  title,
  type = "button",
}: ButtonProps): React.ReactElement {
  const cls = ["btn"];
  if (variant === "primary") cls.push("primary");
  if (variant === "accent") cls.push("accent");
  if (variant === "ghost") cls.push("ghost");
  if (variant === "danger") cls.push("danger");
  if (size === "sm") cls.push("sm");
  if (iconOnly) cls.push("icon");
  return (
    <button type={type} className={cls.join(" ")} onClick={onClick} disabled={disabled} title={title}>
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 13} />}
      {!iconOnly && children}
    </button>
  );
}

// ---------- StatusDot ----------

interface StatusDotProps {
  status: string;
  pulse?: boolean;
}

export function StatusDot({ status, pulse }: StatusDotProps): React.ReactElement {
  return (
    <span
      className={`dot ${status}${pulse ? " pulse" : ""}`}
      style={pulse ? { color: "var(--accent)" } : undefined}
    />
  );
}

// ---------- Pill ----------

interface PillProps {
  tone?: string;
  icon?: string;
  children?: React.ReactNode;
}

export function Pill({ tone = "", icon, children }: PillProps): React.ReactElement {
  return (
    <span className={`pill ${tone}`}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

// ---------- Tag ----------

interface TagProps {
  children?: React.ReactNode;
}

export function Tag({ children }: TagProps): React.ReactElement {
  return <span className="tag">{children}</span>;
}

// ---------- Switch ----------

interface SwitchProps {
  on: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export function Switch({ on, onChange, disabled }: SwitchProps): React.ReactElement {
  return (
    <span
      role="switch"
      aria-checked={on}
      className={`switch ${on ? "on" : ""}`}
      style={disabled ? { opacity: 0.4, pointerEvents: "none" } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
    />
  );
}

// ---------- Countdown ----------

interface CountdownProps {
  nextPollAt: number | null;
  intervalSec: number;
  enabled: boolean;
}

export function Countdown({ nextPollAt, intervalSec, enabled }: CountdownProps): React.ReactElement {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!enabled || !nextPollAt) {
    return <span className="mono dim-2">paused</span>;
  }

  const total = intervalSec;
  const remaining = Math.max(0, (nextPollAt - Date.now()) / 1000);
  const pct = Math.min(1, Math.max(0, 1 - remaining / total));
  const R = 7;
  const C = 2 * Math.PI * R;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span className="ring">
        <svg>
          <circle cx="9" cy="9" r={R} className="track" strokeWidth="1.5" fill="none" />
          <circle
            cx="9"
            cy="9"
            r={R}
            className="fill"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
      </span>
      <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
        {fmtCountdown(nextPollAt)}
      </span>
    </span>
  );
}

// ---------- Tabs ----------

interface TabDef {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps): React.ReactElement {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={`tab ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Drawer ----------

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function Drawer({ open, onClose, children, title, actions }: DrawerProps): React.ReactElement {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`drawer ${open ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div className="drawer-title">{title}</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {actions}
            <Button variant="ghost" iconOnly icon="close" onClick={onClose} title="Close" />
          </div>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

// ---------- Stat ----------

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  foot?: React.ReactNode;
  icon?: string;
  accent?: boolean;
}

export function Stat({ label, value, unit, foot, icon, accent }: StatProps): React.ReactElement {
  return (
    <div className="stat">
      <div className="stat-label">
        {icon && <Icon name={icon} size={11} />}
        {label}
      </div>
      <div className="stat-value" style={accent ? { color: "var(--accent)" } : undefined}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}

// ---------- TagInput ----------

interface TagInputProps {
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps): React.ReactElement {
  const [draft, setDraft] = useState("");
  return (
    <div className="tag-input">
      {value.map((t, i) => (
        <span key={i} className="tag-chip">
          {t}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
            e.preventDefault();
            onChange([...value, draft.trim()]);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

// ---------- FieldInput ----------

interface FieldInputProps {
  field: FieldDescriptor;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function FieldInput({ field, value, onChange }: FieldInputProps): React.ReactElement {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          className="textarea"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    case "number":
      return (
        <input
          className="input"
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case "password":
      return (
        <input
          className="input"
          type="password"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    case "tags":
      return (
        <TagInput
          value={(value as string[]) ?? []}
          onChange={onChange}
          placeholder={field.placeholder ?? "label, then Enter"}
        />
      );
    case "multiselect":
      return (
        <div className="check-group">
          {(field.options ?? []).map((opt) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const on = arr.includes(opt);
            return (
              <label key={opt} className={`check ${on ? "on" : ""}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) =>
                    onChange(e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt))
                  }
                />
                {on && <Icon name="check" size={11} />}
                {opt}
              </label>
            );
          })}
        </div>
      );
    default:
      return (
        <input
          className="input"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
  }
}

// ---------- Field ----------

interface FieldProps {
  field: FieldDescriptor;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function Field({ field, value, onChange }: FieldProps): React.ReactElement {
  return (
    <div className="field">
      <label className="field-label">
        {field.label}
        {field.required && <span className="req">*</span>}
      </label>
      <div>
        <FieldInput field={field} value={value} onChange={onChange} />
        {field.help && <div className="field-help">{field.help}</div>}
      </div>
    </div>
  );
}

// ---------- SourceIcon / NotifierIcon ----------

interface TypeIconProps {
  type: string;
  size?: number;
}

export function SourceIcon({ type, size = 13 }: TypeIconProps): React.ReactElement {
  return <Icon name={sourceIcon(type)} size={size} />;
}

export function NotifierIcon({ type, size = 13 }: TypeIconProps): React.ReactElement {
  return <Icon name={notifierIcon(type)} size={size} />;
}

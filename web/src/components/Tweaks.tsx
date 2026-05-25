import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./ui.js";

// ---------- Types ----------

export type Theme = "dark" | "light";
export type Density = "compact" | "balanced" | "spacious";
export type Accent = "lime" | "amber" | "blue" | "magenta";

export interface TweakValues {
  theme: Theme;
  density: Density;
  accent: Accent;
}

type TweakKey = keyof TweakValues;
type TweakValue<K extends TweakKey> = TweakValues[K];

// ---------- Constants ----------

const ACCENT_HUES: Record<Accent, number> = {
  lime: 145,
  amber: 75,
  blue: 240,
  magenta: 330,
};

const STORAGE_KEY = "monitor.tweaks";

const DEFAULTS: TweakValues = {
  theme: "dark",
  density: "balanced",
  accent: "lime",
};

// ---------- Helpers ----------

function loadTweaks(): TweakValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULTS, ...JSON.parse(raw) } as TweakValues;
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

function saveTweaks(t: TweakValues) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {
    // ignore
  }
}

function applyTweaks(t: TweakValues) {
  const root = document.documentElement;
  root.dataset.theme = t.theme;
  root.dataset.density = t.density;
  root.style.setProperty("--accent-h", String(ACCENT_HUES[t.accent]));
}

// ---------- Hook ----------

export function useTweaks(): [TweakValues, <K extends TweakKey>(key: K, val: TweakValue<K>) => void] {
  const [tweaks, setTweaks] = useState<TweakValues>(loadTweaks);

  // Apply on mount and whenever tweaks change
  useEffect(() => {
    applyTweaks(tweaks);
  }, [tweaks]);

  const setTweak = useCallback(<K extends TweakKey>(key: K, val: TweakValue<K>) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: val };
      saveTweaks(next);
      return next;
    });
  }, []);

  return [tweaks, setTweak];
}

// ---------- Component ----------

interface TweaksProps {
  tweaks: TweakValues;
  setTweak: <K extends TweakKey>(key: K, val: TweakValue<K>) => void;
}

export function Tweaks({ tweaks, setTweak }: TweaksProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tweaks-fab"
        title="Appearance"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle appearance settings"
      >
        <Icon name="settings" size={15} />
      </button>

      {open && (
        <div className="tweaks-panel" role="dialog" aria-label="Appearance settings">
          <div className="tweaks-panel-head">
            <span className="tweaks-panel-title">Appearance</span>
            <button className="tweaks-panel-close" onClick={() => setOpen(false)} aria-label="Close">
              <Icon name="close" size={13} />
            </button>
          </div>

          <div className="tweaks-panel-body">
            {/* Theme */}
            <div className="tweaks-section">
              <div className="tweaks-label">Theme</div>
              <div className="tweaks-radio-group">
                {(["dark", "light"] as Theme[]).map((t) => (
                  <label key={t} className={`tweaks-radio ${tweaks.theme === t ? "on" : ""}`}>
                    <input
                      type="radio"
                      name="theme"
                      value={t}
                      checked={tweaks.theme === t}
                      onChange={() => setTweak("theme", t)}
                    />
                    <Icon name={t === "dark" ? "moon" : "sun"} size={12} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="tweaks-section">
              <div className="tweaks-label">Density</div>
              <div className="tweaks-radio-group">
                {(["compact", "balanced", "spacious"] as Density[]).map((d) => (
                  <label key={d} className={`tweaks-radio ${tweaks.density === d ? "on" : ""}`}>
                    <input
                      type="radio"
                      name="density"
                      value={d}
                      checked={tweaks.density === d}
                      onChange={() => setTweak("density", d)}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            {/* Accent */}
            <div className="tweaks-section">
              <div className="tweaks-label">Accent</div>
              <div className="tweaks-accent-group">
                {(["lime", "amber", "blue", "magenta"] as Accent[]).map((a) => (
                  <button
                    key={a}
                    title={a}
                    className={`tweaks-accent-swatch ${tweaks.accent === a ? "on" : ""}`}
                    style={{ "--swatch-h": String(ACCENT_HUES[a]) } as React.CSSProperties}
                    onClick={() => setTweak("accent", a)}
                    aria-label={a}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React from "react";
import type { FieldDescriptor } from "./api.js";

export function FieldInput({ field, value, onChange }: { field: FieldDescriptor; value: unknown; onChange: (v: unknown) => void }) {
  const label = <label style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{field.label}{field.required ? " *" : ""}</label>;
  let input: React.ReactNode;
  switch (field.type) {
    case "tags":
      input = <input value={(value as string[] | undefined ?? []).join(", ")} placeholder="comma,separated"
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />;
      break;
    case "multiselect":
      input = (
        <span>
          {(field.options ?? []).map((opt) => {
            const arr = (value as string[] | undefined) ?? [];
            return (
              <label key={opt} style={{ marginRight: 10 }}>
                <input type="checkbox" checked={arr.includes(opt)}
                  onChange={(e) => onChange(e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt))} /> {opt}
              </label>
            );
          })}
        </span>
      );
      break;
    case "number":
      input = <input type="number" value={value as number ?? ""} onChange={(e) => onChange(Number(e.target.value))} />;
      break;
    case "password":
      input = <input type="password" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
      break;
    default:
      input = <input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <div style={{ marginBottom: 10 }}>{label}{input}{field.help && <div style={{ fontSize: 11, color: "#666" }}>{field.help}</div>}</div>;
}

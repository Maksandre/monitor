const json = { "content-type": "application/json" };

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? json : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface FieldDescriptor { name: string; label: string; type: string; required: boolean; default?: unknown; help?: string; placeholder?: string; options?: string[]; }
export interface PluginType { type: string; displayName: string; fields: FieldDescriptor[]; }
export interface Monitor { id: string; name: string; sourceType: string; config: Record<string, unknown>; channelId: string | null; pollIntervalSec: number; enabled: boolean; baselined: boolean; lastPolledAt: string | null; lastError: string | null; errorCount: number; }
export interface Channel { id: string; name: string; notifierType: string; config: Record<string, unknown>; }
export interface AlertRow { id: number; monitorId: string; status: string; error: string | null; sentAt: string; }

export const api = {
  sourceTypes: () => req<PluginType[]>("GET", "/api/source-types"),
  notifierTypes: () => req<PluginType[]>("GET", "/api/notifier-types"),
  monitors: () => req<Monitor[]>("GET", "/api/monitors"),
  createMonitor: (m: object) => req<{ id: string }>("POST", "/api/monitors", m),
  updateMonitor: (id: string, m: object) => req<void>("PUT", `/api/monitors/${id}`, m),
  toggleMonitor: (id: string, enabled: boolean) => req<void>("POST", `/api/monitors/${id}/toggle`, { enabled }),
  deleteMonitor: (id: string) => req<void>("DELETE", `/api/monitors/${id}`),
  testMonitor: (id: string) => req<{ events: { dedupeKey: string; title: string; url: string }[] }>("POST", `/api/monitors/${id}/test`),
  channels: () => req<Channel[]>("GET", "/api/channels"),
  createChannel: (c: object) => req<{ id: string }>("POST", "/api/channels", c),
  deleteChannel: (id: string) => req<void>("DELETE", `/api/channels/${id}`),
  alerts: () => req<AlertRow[]>("GET", "/api/alerts"),
  monitorAlerts: (id: string) => req<AlertRow[]>("GET", `/api/monitors/${id}/alerts`),
};

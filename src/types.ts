import type { ZodType, ZodTypeDef } from "zod";

export type FieldType = "text" | "textarea" | "number" | "tags" | "multiselect" | "password";

export interface FieldDescriptor {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  default?: unknown;
  help?: string;
  options?: string[]; // for multiselect
}

export type SourceState = Record<string, unknown>;

export interface MonitorEvent {
  dedupeKey: string; // stable, e.g. "pr:2643:opened"
  kind: string; // source-defined: "opened" | "merged" | ...
  title: string;
  url: string;
  payload: Record<string, unknown>;
}

export interface CheckResult {
  events: MonitorEvent[];
  state: SourceState;
}

export interface Alert {
  monitorName: string;
  event: MonitorEvent;
}

export interface Source<Config = unknown> {
  type: string;
  displayName: string;
  configSchema: ZodType<Config, ZodTypeDef, unknown>;
  fields: FieldDescriptor[];
  check(config: Config, state: SourceState): Promise<CheckResult>;
}

export interface Notifier<Config = unknown> {
  type: string;
  displayName: string;
  configSchema: ZodType<Config, ZodTypeDef, unknown>;
  fields: FieldDescriptor[];
  send(config: Config, alert: Alert): Promise<void>;
}

// DB row types
export interface MonitorRow {
  id: string;
  name: string;
  sourceType: string;
  config: string;
  channelId: string | null;
  pollIntervalSec: number;
  enabled: number;
  baselined: number;
  lastPolledAt: string | null;
  lastError: string | null;
  errorCount: number;
  state: string;
  createdAt: string;
}

export interface ChannelRow {
  id: string;
  name: string;
  notifierType: string;
  config: string;
  createdAt: string;
}

export interface EventRow {
  id: number;
  monitorId: string;
  dedupeKey: string;
  kind: string;
  title: string;
  url: string;
  payload: string;
  seenAt: string;
}

export interface AlertRow {
  id: number;
  monitorId: string;
  eventId: number;
  channelId: string | null;
  status: string;
  error: string | null;
  sentAt: string;
}

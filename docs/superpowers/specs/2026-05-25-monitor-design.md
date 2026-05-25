# Monitor — Extensible Event-Monitoring Service

**Date:** 2026-05-25
**Status:** Approved design

## Purpose

A self-hosted monitoring service that watches external sources for events and
sends alerts. The first concrete use case: watch the
[`opentensor/subtensor`](https://github.com/opentensor/subtensor) repo for pull
requests whose title matches `mainnet deploy` (e.g. "mainnet deploy 5/26/2026")
and alert via Telegram.

The service must be **robust** (restart-safe, fault-isolated) and **naturally
extensible** — adding a new kind of thing to monitor (e.g. prices) should mean
writing one small plugin, with the UI, scheduling, dedup, and alerting working
automatically. Monitor instances are created and configured through a web UI.

Runs in Docker on a Mac mini, single user, local/LAN access.

## Non-goals (YAGNI)

- No multi-service / message-queue architecture. A modular monolith is enough.
- No multi-user auth / RBAC. Single user on a local/LAN box.
- No second source type built now (prices etc.) — but the interface is designed
  so it is trivial to add later. The user explicitly said this is not needed yet.
- No generic no-code rules engine. Source types are code; instances are UI-config.

## Background: the real subtensor PR pattern

Observed from live data (`gh pr list --repo opentensor/subtensor --search "mainnet deploy in:title" --state all`):

- Titles reliably contain the case-insensitive substring **`mainnet deploy`**,
  followed by a date in varying formats: `5/26/2026`, `4-23-2026`, etc.
- Suffixes/variants occur: `(part 2)`, `(MeV Shield)`, date placed before/after.
- A `deploy-mainnet` label exists but is applied **inconsistently** — not reliable
  on its own.
- `Revert "mainnet deploy 2/20/2026"` PRs also contain the phrase (optionally excluded).
- These PRs are **opened well ahead** of the deploy date (e.g. PR #2643 "mainnet
  deploy 5/26/2026" opened on 5/6) and later merged.

Conclusion: a case-insensitive **title substring** match (`mainnet deploy`) is the
robust catch-all; an optional `excludeMatch` (`revert`) and optional label filter
refine it. Which lifecycle transitions alert (opened / merged / …) is
**user-configurable per monitor via the UI**.

## Architecture

A single Node.js service (modular monolith), packaged in Docker.

```
┌─────────────────────────── Node service (Docker) ───────────────────────────┐
│                                                                              │
│   Scheduler ──► Source plugin.check(config,state) ──► Events                 │
│      │                  (github-pull-requests, …)        │                   │
│      │                                                   ▼                   │
│      │                                          Dedup / event store          │
│      │                                                   │ (new events only) │
│      │                                                   ▼                   │
│      │                                          Notifier plugin.send()       │
│      │                                              (telegram, …)            │
│      ▼                                                                       │
│   Fastify REST API  ◄───────────────────────────►  SQLite (better-sqlite3)  │
│      ▲                                              monitors, channels,      │
│      │                                              events, alerts           │
│   React/Vite SPA (served as static files)                                    │
└──────────────────────────────────────────────────────────────────────────────┘
        secrets via .env  ·  docker-compose with data volume  ·  restart: unless-stopped
```

**Stack:** TypeScript end-to-end. Node + Fastify (API + static file serving +
scheduler), React + Vite (UI), SQLite via `better-sqlite3`, Zod for schemas,
pino for logging. One language across the whole stack; the plugin interfaces are
type-safe.

## Plugin interfaces (extensibility core)

```typescript
// A Source knows how to check an external thing and emit events.
interface Source<Config> {
  type: string;                    // "github-pull-requests"
  displayName: string;             // shown in UI
  configSchema: ZodSchema<Config>; // UI renders a form + validates from this
  check(config: Config, state: SourceState): Promise<{
    events: MonitorEvent[];        // candidate events found this poll
    state: SourceState;            // opaque cursor persisted for next poll
  }>;
}

// A Notifier knows how to deliver a message.
interface Notifier<Config> {
  type: string;                    // "telegram"
  configSchema: ZodSchema<Config>;
  send(config: Config, alert: Alert): Promise<void>;
}

interface MonitorEvent {
  dedupeKey: string;   // stable, e.g. "pr:2643:opened" — used to never re-alert
  kind: string;        // "opened" | "merged" | ... (source-defined)
  title: string;
  url: string;
  payload: object;     // raw bits for the message template
}
```

Both interfaces are registered in a central registry. Adding a new source type
(or notifier type) = implement the interface in one file + register it. The UI
form for an instance is rendered from `configSchema`, so no UI changes are needed
to support a new source type's parameters.

## Data model (SQLite)

- **`monitors`** — `id, name, sourceType, config (JSON), channelId, pollIntervalSec,
  enabled, lastPolledAt, lastError, state (JSON cursor)`
- **`channels`** — `id, name, notifierType, config (JSON)` — notifier instances
  (e.g. a Telegram channel). Secret values stored here (local single-user box);
  may be seeded from env on first run.
- **`events`** — `id, monitorId, dedupeKey, kind, title, url, payload, seenAt`.
  Unique constraint on `(monitorId, dedupeKey)` — this is the dedup ledger and the
  history.
- **`alerts`** — `id, monitorId, eventId, channelId, status, sentAt, error` —
  delivery log.

## Data flow

1. Scheduler tick → for each enabled monitor whose interval is due →
2. Call `source.check(config, savedState)` →
3. For each returned event, compute `dedupeKey`; if `(monitorId, dedupeKey)` is
   **new**, insert into `events` →
4. Filter to the monitor's configured `triggerKinds`; for matching new events,
   send via the monitor's channel notifier, log to `alerts` →
5. Persist updated `state`, `lastPolledAt`, clear/set `lastError`.

**Baseline seeding:** on a monitor's first poll, current matching items are
recorded into `events` **without alerting**, so startup does not produce a backlog
blast. Only transitions newly observed after the baseline alert.

## The subtensor monitor (first instance)

`github-pull-requests` source. Config (all UI-editable):

```
repo:          "opentensor/subtensor"
titleMatch:    "mainnet deploy"      (case-insensitive substring; regex also allowed)
excludeMatch:  "revert"              (optional, skip Revert PRs)
labels:        []                    (optional AND-filter)
triggerKinds:  ["opened", "merged"]  (configurable lifecycle events)
```

Lists PRs via the GitHub API (PAT from env for 5000 req/hr; works unauthenticated
for low frequencies too). Filters by rules, emits one event per qualifying
lifecycle transition with `dedupeKey` like `pr:<number>:<kind>`. Default poll
interval ~120s, configurable per monitor.

## Robustness

- State in SQLite survives restarts; enabled monitors resume from saved cursor on boot.
- Each monitor poll runs in its own try/catch; an erroring monitor records
  `lastError` (shown in UI) and never crashes the service or other monitors.
- Backoff on repeated source errors (GitHub rate-limit / 5xx); respects `Retry-After`.
- Failed notifier sends retried with backoff and logged in `alerts`.
- Docker `restart: unless-stopped` + a `/health` endpoint for self-healing.
- Structured logging (pino).

## UI (React/Vite SPA, no auth)

- **Monitors list** — name, source type, enabled toggle, last poll, last
  result/error, recent alerts.
- **Add/Edit monitor** — pick source type → form auto-rendered from `configSchema`
  → pick channel → set poll interval. **"Test now"** button does a dry-run check and
  shows what would match/alert.
- **Channels** — CRUD notifier instances (Telegram bot token + chat id).
- **Alert history** — searchable log of fired alerts.

Single-user, local/LAN; no authentication in v1 (documented deploy assumption).

## Deployment

- Multi-stage `Dockerfile`: build TS backend + Vite frontend → slim runtime image;
  Node service serves both API and static SPA on one port.
- `docker-compose.yml`: one service, named volume for the SQLite file,
  `restart: unless-stopped`, env for secrets.
- `.env` / `.env.example`: `GITHUB_TOKEN`, Telegram `BOT_TOKEN` / `CHAT_ID`
  (channel secrets live in DB but can be seeded from env on first run). Includes
  BotFather setup steps to obtain a bot token + chat id.

## Testing (TDD)

- **Unit:** GitHub source matching/dedup against real fixture PRs (slash/dash dates,
  "part 2", "Revert", label variants); scheduler timing; notifier with mocked HTTP.
- **Integration:** full poll→dedup→alert flow with a fake source + fake notifier —
  asserts baseline-seeding silence, then alerts only on newly observed transitions;
  API CRUD endpoints.
- **No live network in tests** — GitHub and Telegram are behind injectable clients.

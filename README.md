# Monitor

Extensible event-monitoring service. Polls pluggable **sources** for events and
delivers alerts through pluggable **notifiers**. Ships with a GitHub
pull-requests source and a Telegram notifier; first use case is alerting when an
`opentensor/subtensor` PR titled `mainnet deploy …` is opened or merged.

## Run with Docker (Mac mini)

```bash
cp .env.example .env   # fill in TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, optional GITHUB_TOKEN
docker compose up -d --build
```

Open the UI at http://localhost:8473. On first run, if Telegram env vars are set,
a default subtensor monitor + Telegram channel are seeded. The first poll seeds a
silent baseline (no backlog blast); you are alerted only on new PR transitions.

> Single-user, no authentication. Bind only to your LAN; do not expose to the
> public internet without putting auth in front of it.

## Development

```bash
npm install
npm run dev            # backend on :8473 (tsx watch)
cd web && npm install && npm run dev   # UI on :5173, proxies /api to :8473
npm test               # backend test suite (vitest)
```

## Add a new source type

1. Implement `Source<Config>` in `src/plugins/sources/<name>.ts` (a `configSchema`,
   a `fields` descriptor for the UI form, and a `check()` that returns events with
   stable `dedupeKey`s).
2. Register it in `src/plugins/index.ts`.

The UI form, scheduling, dedup, and alerting work automatically. Notifiers follow
the same pattern under `src/plugins/notifiers/`.

## Known limitations (v1)

- **No UI authentication.** Single-user, LAN-only by design.
- **GitHub source reads one page** (the 100 most-recently-updated PRs) per poll.
  Because PRs are sorted by `updated`, a PR's open/merge transition bumps it to
  the top, so it is reliably seen at the moment it changes given the short poll
  interval; a transition would only be missed if 100+ *other* PRs were updated
  within a single poll window. Multi-page pagination is a future enhancement.
- **GitHub rate limiting** is handled by the scheduler's exponential backoff
  (repeated errors slow a monitor's polling), not by honoring `Retry-After`
  explicitly. Set `GITHUB_TOKEN` to get the 5000 req/hr authenticated limit.
- **A permanently-failed alert is not retried across polls.** Delivery is retried
  up to 3 times within a poll; after that the failure is recorded in the alerts
  log (visible in the UI) but not re-sent on later polls.
- **Secrets (Telegram bot token) are stored in the SQLite DB** and redacted on
  API reads. Acceptable for a local single-user box.

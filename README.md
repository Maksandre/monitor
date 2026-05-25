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

Open the UI at http://localhost:8080. On first run, if Telegram env vars are set,
a default subtensor monitor + Telegram channel are seeded. The first poll seeds a
silent baseline (no backlog blast); you are alerted only on new PR transitions.

> Single-user, no authentication. Bind only to your LAN; do not expose to the
> public internet without putting auth in front of it.

## Development

```bash
npm install
npm run dev            # backend on :8080 (tsx watch)
cd web && npm install && npm run dev   # UI on :5173, proxies /api to :8080
npm test               # backend test suite (vitest)
```

## Add a new source type

1. Implement `Source<Config>` in `src/plugins/sources/<name>.ts` (a `configSchema`,
   a `fields` descriptor for the UI form, and a `check()` that returns events with
   stable `dedupeKey`s).
2. Register it in `src/plugins/index.ts`.

The UI form, scheduling, dedup, and alerting work automatically. Notifiers follow
the same pattern under `src/plugins/notifiers/`.

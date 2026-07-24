# Backend

Non-custodial API for:

- Ark indexer watch per registered `vtxo_script_hex`
- Expo push on received payments and optional VTXO-expiry reminders
- Public app version / force-update config

**Stack:** Express, TypeScript, Prisma, PostgreSQL.

The server never holds wallet seeds or funds.

## Local development

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install   # from repo root preferred
npx prisma migrate dev
npm run dev
```

- **Health:** `GET http://localhost:3000/health`
- **App config:** `GET http://localhost:3000/v1/app/config`
- **OpenAPI:** `GET http://localhost:3000/openapi.json` · Swagger UI at `/docs`
- Generated client: `packages/api-client` (`@21w/api-client`)

Ark indexer `expires_at` values are **Unix seconds**.

## HTTP API (v1)

| Method   | Path                         | Auth                         |
| -------- | ---------------------------- | ---------------------------- |
| `GET`    | `/health`                    | none                         |
| `GET`    | `/v1/app/config`             | none                         |
| `POST`   | `/v1/auth/challenges`        | none (rate-limited)          |
| `POST`   | `/v1/devices/sync`           | wallet-signed challenge      |
| `DELETE` | `/v1/devices/:deviceId`      | wallet-signed challenge      |

See `openapi/openapi.json` for the full contract.

## Layout

```
backend/
  api/           # HTTP routes (thin)
  services/      # Domain logic
  middleware/    # Express middleware
  lib/           # Prisma, env, helpers
  workers/       # Indexer watch + push loops
  prisma/        # Schema and migrations
```

## Data model

No user accounts.

| Table           | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| **`ArkWallet`** | `vtxo_script_hex` (watch key), optional static address display  |
| **`Device`**    | Expo push token + platform, linked to an `ArkWallet`            |

## Workers

On startup (unless `WORKERS_ENABLED=false`):

- Subscribe to indexer `newVtxos` → incoming-funds push
- Optional hourly VTXO expiry reminders (`VTXO_EXPIRY_WORKER_ENABLED=true`)

## Deploy notes

Self-hosting needs Postgres, env from `.env.example`, and Expo push credentials. Prefer deploying API changes before dependent mobile releases, and keep the API backward compatible with builds already in the field.

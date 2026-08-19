# API client (`@21w/api-client`)

Generated TypeScript client for the 21W backend API.

## Generate

From repo root (after OpenAPI spec changes):

```bash
npm run openapi:generate
```

This runs `backend/openapi/generate.ts` (Zod → `openapi/openapi.json`) then `@hey-api/openapi-ts` into `src/generated/`.

## Usage (mobile)

```typescript
import { configureApiClient, useAppConfigQuery } from "@21w/api-client";

configureApiClient("http://localhost:3000");

const { data, isLoading } = useAppConfigQuery();
```

Wallet-signed device sync stays in `apps/mobile/lib/syncBackendDevice.ts` — it calls generated `createAuthChallenge` / `syncDevice` / `revokeDevice` SDK functions.

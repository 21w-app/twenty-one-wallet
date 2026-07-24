# 21W — Twenty One Wallet

Simple **self-custodial** Bitcoin mobile wallet powered by [Ark](https://arkadeos.com/).

This repository is published for **source transparency**: you can audit that the wallet is non-custodial and how it works. It is not a turnkey self-host kit — shipping your own builds still needs Apple/Google developer accounts, Expo/EAS, push credentials, and your own backend configuration.

**Product site:** [21w.app](https://21w.app) · **Support:** [support@21w.app](mailto:support@21w.app)

## What ships today

- Receive and send Bitcoin via **Ark**
- Fund / withdraw with **Lightning** and **on-chain** (embedded Boltz swaps)
- Activity history, local contacts / address book
- Optional **remote payment alerts** (push) via a non-custodial backend (no seed or funds on the server)
- Optional **Nostr** discoverability helpers (see `docs/nostr/`)
- iOS (TestFlight / App Store) and Android (sideload APK from the site)

## Repository layout

```
apps/mobile/    Expo React Native wallet
backend/        Non-custodial API (indexer watch + Expo push)
web/            Marketing site, privacy policy, support
packages/       Shared typed API client
openapi/        OpenAPI contract
```

## Stack (overview)

| Area    | Choices                                              |
| ------- | ---------------------------------------------------- |
| Mobile  | TypeScript, Expo (SDK 54), Expo Router, React Native |
| Bitcoin | `@arkade-os/sdk`, Boltz swaps                        |
| Backend | Node.js, Express, Prisma, PostgreSQL                 |
| Push    | Expo Push (APNs / FCM via EAS)                       |

## Audit / local exploration

```bash
npm install
npm run typecheck
```

Mobile and backend need local env files (see `apps/mobile/.env.example` and `backend/.env.example`). Real Firebase/`google-services.json`, EAS project IDs, and production API URLs are **not** committed.

Backend health (after local setup): `GET /health`, `GET /v1/app/config`.

## License

[MIT](LICENSE)

# Web

Public web content for 21W — separate from the mobile app in `apps/mobile/`.

| Path                                 | URL (when deployed) | Purpose                                             |
| ------------------------------------ | ------------------- | --------------------------------------------------- |
| [`index.html`](index.html)           | `/`                 | Product landing with app screenshots                |
| [`product/`](product/)               | `/product/`         | Redirects to `/`                                    |
| [`privacy-policy/`](privacy-policy/) | `/privacy-policy/`  | Privacy policy — **required** for App Store Connect |
| [`support/`](support/)               | `/support/`         | Support contact page                                |

Shared styles: [`styles.css`](styles.css).

## Before you deploy

1. **Support email** — `support@21w.app` (Cloudflare Email Routing → owner inbox).
2. **Custom domain** — e.g. `21w.app`; use `https://21w.app/privacy-policy/` in App Store Connect.

## Deploy on Vercel (recommended)

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New Project** → import `1989TomE/21W`.
3. Set **Root Directory** to `web`.
4. Framework preset: **Other** (static HTML).
5. Deploy.
6. Optional: **Settings → Domains** → add your domain.

App Store privacy policy URL:

```text
https://<your-domain>/privacy-policy/
```

## Local preview

```bash
cd web
python3 -m http.server 8080
```

Open `http://localhost:8080/`, `/privacy-policy/`, or `/support/`.

## Future: `product/`

The current `product/index.html` redirects to `/`. A richer marketing site can replace it later without changing the privacy/support pages.

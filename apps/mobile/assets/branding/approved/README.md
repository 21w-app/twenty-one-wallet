# Approved branding — owner mock (2026-06-10)

## Source of truth

**`app-icon.png`** — all other assets are derived from this file so the `21W` mark is identical everywhere.

| File                                   | Use                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `app-icon.png`                         | iOS / Android app icon (1024 base; Expo resizes)                                                |
| `android-adaptive-icon-foreground.png` | Android adaptive-icon foreground — transparent 1024 canvas with conservative safe-zone padding  |
| `android-splash-icon.png`              | Android 12+ native splash icon — same padded canvas as adaptive foreground (fits circular mask) |
| `logo-header.png`                      | Top-left header on dark backgrounds — **cropped/scaled from `app-icon.png`**                    |
| `splash-screen.png`                    | Launch screen — black field, **same logo centered, no text**                                    |
| `logo-mark-extracted.png`              | Intermediate crop of the mark from `app-icon.png`                                               |
| `owner-ui-mock-reference.png`          | Full UI mock (layout/theme reference for screens)                                               |

## Logo mark

- White **21** + white **W**
- Small **orange `#F7931A` triangle** at the top-right tip of the **W** only
- Do not regenerate header/splash with AI — re-run `../generate-from-app-icon.py` if the icon changes

## Splash

- Solid black background
- Centered `21W` mark only — **no tagline**

#!/usr/bin/env bash
# Pre-publish scrub checks for a clean public source tree.
# Run from repo root. Exit 0 = pass; non-zero = failures listed on stderr.
# Uses only git + bash (no ripgrep dependency).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

fail=0
note() { printf '%s\n' "$*"; }
bad() {
  printf 'FAIL: %s\n' "$*" >&2
  fail=1
}

note "=== OSS pre-export scrub ==="

# Deny-list paths (examples are allowed)
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  base="${path##*/}"
  case "$base" in
    .env.example) continue ;;
    .env | .env*)
      bad "tracked deny-list path: $path"
      ;;
  esac
  case "$path" in
    */google-services.json | google-services.json | \
    */GoogleService-Info.plist | GoogleService-Info.plist | \
    AuthKey_*.p8 | */AuthKey_*.p8 | \
    */.vercel/* | .vercel/* | \
    *.p12 | *.jks | *.mobileprovision)
      bad "tracked deny-list path: $path"
      ;;
  esac
done < <(git ls-files)

if git grep -qE '[a-z0-9-]+\.up\.railway\.app' -- .; then
  bad "Railway default hostname (*.up.railway.app) found in tracked files"
else
  note "OK: no *.up.railway.app hostnames"
fi

# Split needles so this script file does not self-match the PII check.
pii_pattern="tebert""@|@seznam""\\.cz|toma""sebert"
if git grep -qiE "$pii_pattern" -- . ':!scripts/oss-pre-export-scrub.sh'; then
  bad "personal email / Expo account slug found in tracked files"
else
  note "OK: no personal email / Expo account slug in tracked files"
fi

for f in AGENTS.md CODING_RULES.md LESSONS_LEARNED.md CURRENT.md TASKS.md ACTIVITY.md; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    bad "local-only file still tracked: $f"
  fi
done
if [[ -n "$(git ls-files '.cursor' '.cursor/**' 2>/dev/null || true)" ]]; then
  bad "AI know-how still tracked under .cursor/"
else
  note "OK: AI know-how and ops coordination files not tracked"
fi

if git grep -qE 'AIza[0-9A-Za-z_-]{20,}' -- .; then
  bad "Firebase-looking API key string in tracked files"
else
  note "OK: no Firebase API key strings"
fi

# Hot-path clone defaults must not point at product production API
if git grep -qE 'api\.21w\.app' -- apps/mobile/eas.json apps/mobile/package.json apps/mobile/lib apps/mobile/.env.example packages/api-client openapi backend/openapi 2>/dev/null; then
  bad "product API host still in clone defaults / generated client hot paths"
else
  note "OK: no product API host in mobile/OpenAPI clone defaults"
fi

if [[ "$fail" -ne 0 ]]; then
  note "=== scrub FAILED ==="
  exit 1
fi

note "=== scrub PASSED ==="
note "Public tree should stay source-transparency lean (no private process docs)."
exit 0

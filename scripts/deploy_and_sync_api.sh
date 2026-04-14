#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PRIVATE_DIR="$ROOT_DIR/private"
FORM_HTML="$ROOT_DIR/form.html"

AUTO_COMMIT=false
AUTO_PUSH=false
SKIP_SMOKE=false
API_URL_OVERRIDE=""

for arg in "$@"; do
  case "$arg" in
    --commit) AUTO_COMMIT=true ;;
    --push) AUTO_PUSH=true ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./scripts/deploy_and_sync_api.sh [--commit] [--push]

What it does:
1) Pushes Apps Script files with clasp
2) Optionally updates form.html window.FORM_API_URL (when --api-url is passed)
3) Runs a smoke test against generateLink endpoint (default)
4) Optionally commits/pushes the frontend update

IMPORTANT:
- This script does NOT run clasp deploy. Use the Apps Script UI to publish a new web app version.
- Safe workflow: clasp push -> Apps Script Deploy UI -> copy /exec URL -> run this script with --api-url.

Flags:
  --commit   Create a git commit with updated form.html
  --push     Push commit to origin/main (implies --commit)
  --api-url <url>       Update form.html fallback API URL to this /exec URL
  --skip-smoke           Skip API smoke test (not recommended)
USAGE
      exit 0
      ;;
  esac
done

while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit)
      AUTO_COMMIT=true
      shift
      ;;
    --push)
      AUTO_PUSH=true
      shift
      ;;
    --api-url)
      API_URL_OVERRIDE="${2:-}"
      if [[ -z "$API_URL_OVERRIDE" ]]; then
        echo "Missing value for --api-url" >&2
        exit 1
      fi
      shift 2
      ;;
    --skip-smoke)
      SKIP_SMOKE=true
      shift
      ;;
    --help|-h)
      shift
      ;;
    *)
      echo "Unknown flag: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "$AUTO_PUSH" == true ]]; then
  AUTO_COMMIT=true
fi

echo "[1/4] Pushing Apps Script files..."
cd "$PRIVATE_DIR"
npx @google/clasp push --force

EXISTING_API_URL="$(sed -nE "s|.*window\.FORM_API_URL = '(https://script.google.com/macros/s/[^']+/exec)';.*|\1|p" "$FORM_HTML" | head -n1)"

if [[ -n "$API_URL_OVERRIDE" ]]; then
  if [[ ! "$API_URL_OVERRIDE" =~ ^https://script\.google\.com/macros/s/[^/]+/exec(\?.*)?$ ]]; then
    echo "Invalid --api-url. Expected https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec" >&2
    exit 1
  fi

  API_URL="${API_URL_OVERRIDE%%\?*}"
  echo "[2/4] Updating form.html with provided API URL..."
  cd "$ROOT_DIR"
  sed -i '' -E "s|window\.FORM_API_URL = '[^']+';|window.FORM_API_URL = '$API_URL';|" "$FORM_HTML"
  echo "Updated FORM_API_URL in $FORM_HTML"
elif [[ -n "$EXISTING_API_URL" ]]; then
  API_URL="$EXISTING_API_URL"
  echo "[2/4] Keeping existing API URL from form.html: $API_URL"
else
  echo "Could not determine API URL. Pass --api-url <https://script.google.com/macros/s/.../exec>." >&2
  exit 1
fi

echo "[3/4] Reminder: publish the new version in Apps Script UI (Deploy -> Manage deployments -> Edit -> New version)."

if [[ "$SKIP_SMOKE" == false ]]; then
  echo "[4/4] Running API smoke test..."
  TEST_EMAIL="spshen2+deploysmoke$(date '+%Y%m%d%H%M%S')@hotmail.com"
  RESP="$(curl -sS -L "$API_URL?action=generateLink&email=$TEST_EMAIL&plan=supplemental_individual&weekStart=2026-04-13")"
  if ! printf '%s' "$RESP" | node -e 'const fs=require("fs");const s=fs.readFileSync(0,"utf8");let ok=false;try{const j=JSON.parse(s);ok=!!(j&&j.success&&j.link);}catch(_){ok=false;}if(!ok){process.exit(1);}'; then
    echo "Smoke test failed: endpoint did not return expected JSON success payload." >&2
    echo "Likely causes:" >&2
    echo "  1) Apps Script UI deployment was not published after push." >&2
    echo "  2) Web app access settings are incorrect (Execute as / Who has access)." >&2
    echo "  3) form.html points at a stale or non-callable /exec URL." >&2
    exit 2
  fi
  echo "Smoke test passed."
fi

echo "Optional git commit/push..."
if [[ "$AUTO_COMMIT" == true ]]; then
  git add form.html
  git commit -m "Sync frontend API URL"
  if [[ "$AUTO_PUSH" == true ]]; then
    git push
  fi
fi

echo "Done."
echo "API URL: $API_URL"

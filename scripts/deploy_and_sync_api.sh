#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PRIVATE_DIR="$ROOT_DIR/private"
FORM_HTML="$ROOT_DIR/form.html"

AUTO_COMMIT=false
AUTO_PUSH=false
DEPLOYMENT_ID=""
IN_PLACE=true
SKIP_SMOKE=false

for arg in "$@"; do
  case "$arg" in
    --commit) AUTO_COMMIT=true ;;
    --push) AUTO_PUSH=true ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./scripts/deploy_and_sync_api.sh [--commit] [--push]

What it does:
1) Pushes Apps Script files with clasp
2) Updates existing web app deployment in place (default)
3) Builds /exec URL from the deployment ID
4) Updates form.html window.FORM_API_URL automatically
5) Optionally commits/pushes the frontend update
6) Runs a smoke test against generateLink endpoint (default)

Flags:
  --commit   Create a git commit with updated form.html
  --push     Push commit to origin/main (implies --commit)
  --deployment-id <id>  Force a specific deployment ID to update
  --new-deployment       Create a new deployment ID instead of in-place update
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
    --deployment-id)
      DEPLOYMENT_ID="${2:-}"
      if [[ -z "$DEPLOYMENT_ID" ]]; then
        echo "Missing value for --deployment-id" >&2
        exit 1
      fi
      shift 2
      ;;
    --new-deployment)
      IN_PLACE=false
      shift
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

if [[ -z "$DEPLOYMENT_ID" ]]; then
  EXISTING_URL="$(sed -nE "s|.*window\\.FORM_API_URL = 'https://script.google.com/macros/s/([^/]+)/exec';.*|\1|p" "$FORM_HTML" | head -n1)"
  if [[ -n "$EXISTING_URL" ]]; then
    DEPLOYMENT_ID="$EXISTING_URL"
  fi
fi

if [[ "$IN_PLACE" == true && -n "$DEPLOYMENT_ID" ]]; then
  echo "[2/4] Updating deployment in place: $DEPLOYMENT_ID"
  npx @google/clasp deploy --deploymentId "$DEPLOYMENT_ID" --description "auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
  DEPLOY_ID="$DEPLOYMENT_ID"
else
  echo "[2/4] Creating new deployment..."
  DEPLOY_OUTPUT="$(npx @google/clasp deploy --description "auto-sync $(date '+%Y-%m-%d %H:%M:%S')")"
  echo "$DEPLOY_OUTPUT"
  DEPLOY_ID="$(printf '%s\n' "$DEPLOY_OUTPUT" | sed -nE 's/.*\- (AKfy[a-zA-Z0-9_-]+).*/\1/p' | head -n1)"
  if [[ -z "$DEPLOY_ID" ]]; then
    DEPLOY_ID="$(printf '%s\n' "$DEPLOY_OUTPUT" | sed -nE 's/.*Deployed (AKfy[a-zA-Z0-9_-]+).*/\1/p' | head -n1)"
  fi
  if [[ -z "$DEPLOY_ID" ]]; then
    echo "Failed to parse deployment ID from clasp output." >&2
    exit 1
  fi
fi

API_URL="https://script.google.com/macros/s/$DEPLOY_ID/exec"
echo "Detected API URL: $API_URL"

echo "[3/4] Updating form.html..."
cd "$ROOT_DIR"
sed -i '' -E "s|window\\.FORM_API_URL = '[^']+';|window.FORM_API_URL = '$API_URL';|" "$FORM_HTML"

echo "Updated FORM_API_URL in $FORM_HTML"

if [[ "$SKIP_SMOKE" == false ]]; then
  echo "[4/5] Running API smoke test..."
  TEST_EMAIL="deploy-smoke+$(date '+%Y%m%d%H%M%S')@example.com"
  RESP="$(curl -sS -L "$API_URL?action=generateLink&customerEmail=$TEST_EMAIL&name=Deploy%20Smoke&weekStart=2026-04-13")"
  if ! printf '%s' "$RESP" | node -e 'const fs=require("fs");const s=fs.readFileSync(0,"utf8");let ok=false;try{const j=JSON.parse(s);ok=!!(j&&j.success&&j.link);}catch(_){ok=false;}if(!ok){process.exit(1);}'; then
    echo "Smoke test failed: endpoint did not return expected JSON success payload." >&2
    echo "Likely causes:" >&2
    echo "  1) Web app access settings changed (Apps Script Deploy > Manage deployments)." >&2
    echo "  2) Deployment ID in form.html does not map to a callable web app." >&2
    echo "  3) You need to update the existing web app deployment instead of creating a new ID." >&2
    exit 2
  fi
  echo "Smoke test passed."
fi

echo "[5/5] Optional git commit/push..."
if [[ "$AUTO_COMMIT" == true ]]; then
  git add form.html
  git commit -m "Sync frontend API URL to latest Apps Script deployment"
  if [[ "$AUTO_PUSH" == true ]]; then
    git push
  fi
fi

echo "Done."
echo "API URL: $API_URL"

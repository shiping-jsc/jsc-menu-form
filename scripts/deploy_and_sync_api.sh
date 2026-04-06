#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PRIVATE_DIR="$ROOT_DIR/private"
FORM_HTML="$ROOT_DIR/form.html"

AUTO_COMMIT=false
AUTO_PUSH=false
DEPLOYMENT_ID=""
IN_PLACE=true

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

Flags:
  --commit   Create a git commit with updated form.html
  --push     Push commit to origin/main (implies --commit)
  --deployment-id <id>  Force a specific deployment ID to update
  --new-deployment       Create a new deployment ID instead of in-place update
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

echo "[4/4] Optional git commit/push..."
if [[ "$AUTO_COMMIT" == true ]]; then
  git add form.html
  git commit -m "Sync frontend API URL to latest Apps Script deployment"
  if [[ "$AUTO_PUSH" == true ]]; then
    git push
  fi
fi

echo "Done."
echo "API URL: $API_URL"

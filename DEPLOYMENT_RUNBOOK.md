# Deployment Runbook (Permanent)

This file is tracked in git on purpose.

## Why this exists

We repeatedly hit the same deployment issues:
- `clasp` command missing in shell.
- New deployment IDs created while frontend still points to older `/exec` URL.
- Deploy commands run outside `private/` where `.clasp.json` lives.
- Access settings causing `/exec` to show Google "Page Not Found" instead of API JSON.

## Standard command (use this every time)

Run from repo root:

```bash
./scripts/deploy_and_sync_api.sh --commit --push
```

What it does:
1. Pushes Apps Script code via `npx @google/clasp`.
2. Updates existing web app deployment in place by default.
3. Keeps/derives the correct `/exec` URL.
4. Syncs `window.FORM_API_URL` in `form.html`.
5. Optionally commits and pushes frontend URL sync.

## Optional command variants

Create a brand new deployment ID:

```bash
./scripts/deploy_and_sync_api.sh --new-deployment --commit --push
```

Target a specific deployment ID:

```bash
./scripts/deploy_and_sync_api.sh --deployment-id AKfy... --commit --push
```

## Release checklist

1. Run deploy script from repo root.
2. Confirm script reports deployment update success.
3. Verify frontend API URL in `form.html` matches expected deployment ID.
4. Smoke test endpoint:
   - `GET /exec?action=generateLink...`
5. Submit one end-to-end test form and verify:
   - Sheet row created/updated.
   - Confirmation email contains latest template and sender alias.

## If something fails

`clasp: command not found`
- Use `npx @google/clasp ...` (script already does this).

`invalid_grant` / reauth errors
- `npx @google/clasp logout`
- `npx @google/clasp login`
- Re-run deploy script.

Google "Page Not Found" from `/exec`
- Check Apps Script deployment access settings in UI.
- Confirm frontend is using the intended deployment URL.
- Confirm deployment was updated from the right project (`private/.clasp.json`).

---
name: jsc-menu-forms-workspace
description: "Use when: working on the Jackie's Supper Club menu form project. Encodes deployment practices, architecture patterns, debugging strategies, and user interaction preferences for this workspace."
---

# JSC Menu Forms — Workspace Instructions

## Interaction Preferences

- **Always use inline prompts** for user responses when interaction is needed.
- **Every inline prompt must include explicit escape text "stop":**  If user replies `stop`, halt the current sequence immediately and ask what to do next (again via inline prompt).
- This applies across all chat sessions and models in this workspace.

## Deployment & CLI Rules

### Critical: Do NOT use `clasp deploy --deploymentId` on UI-created web-app deployments
- **Root cause:** In-place CLI deploys reset web-app access settings and cause 404 errors on the `/exec` endpoint.
- **Safe workflow:**
  1. `npx @google/clasp push --force` (code only, from `private/` dir)
  2. Go to Apps Script editor → **Deploy** → **Manage deployments** → **Edit** existing → **New version** (do NOT change "Execute as" or "Who has access")
  3. If endpoint breaks after a CLI redeploy, user must create a new UI deployment via **Deploy** → **New deployment** → **Web app** → **Execute as: Me** → **Who has access: Anyone** → **Deploy**
  4. Copy the new `/exec` URL and update `form.html` `FORM_API_URL` immediately
- Always commit and push the updated `form.html` after a new deployment to keep the fallback URL current.
- Never trust terminal endpoint checks (GET/POST) as sole truth — test in real browser first to catch intermittent access issues.

### Deploy Script
- `scripts/deploy_and_sync_api.sh` automates `clasp push` + URL sync + smoke test.
- As of April 2026, it has a clasp output parser fix to handle both old and new `clasp deploy` output formats.

## Architecture & Integration Patterns

### Squarespace Iframe Wrapper
The live `jackiessupperclub.com/menu-selection` page embeds the form via an iframe:
```javascript
var params = new URLSearchParams(window.location.search);
var token = params.get('token');
var api = params.get('api');  // CRITICAL: must be passed through
var src = 'https://shiping-jsc.github.io/jsc-menu-form/form.html?token=' + encodeURIComponent(token);
if (api) { src += '&api=' + encodeURIComponent(api); }
// Create iframe with this src
```

**Why:** The iframe needs both `token` and `api` params to function. Without `api`, it falls back to the hardcoded `FORM_API_URL` in GitHub Pages, which can drift with each deployment. The `api` param ensures it always calls the correct live endpoint.

### GitHub Pages as Fallback Frontend
- Frontend files (`form.html`, `form.js`, `form.css`) are hosted on GitHub Pages at `https://shiping-jsc.github.io/jsc-menu-form/`.
- This provides a fallback if the Squarespace wrapper is misconfigured or if users have direct GitHub links.
- **Always commit and push the frontend after updating** `FORM_API_URL`, especially after a new deployment.

## Token & Security Model

- Tokens are HMAC-signed in Apps Script (`Security.gs`).
- Token signature encoding matches Apps Script's byte-to-char conversion: invalid Python local token generation will fail verification.
- Use the Apps Script backend `generateLink` or `displayFormLink` functions to create authoritative tokens.
- If testing locally, emulate the exact Apps Script signature bytes-to-chars-to-base64 pipeline.

## Resubmission Logic

- **Same token + email + plan + weekStart = same submission ID** (the row is updated, not created twice).
- The frontend checks for `existingSubmission` in the prefill `GET` response.
- If existing submission found, show resubmission gate: "Would you like to resubmit an updated form?"
- Submit success response includes `updated: true/false` flag.

## Safari Cross-Origin ITP Issue

**Symptom:** Form submits successfully (data saved, email sent), but Safari shows "Load failed" error.

**Root cause:** Safari's cross-site tracking prevention blocks the fetch response when Apps Script redirects it via `script.googleusercontent.com` (third-party domain crossing).

**Fix (in `form.js`):** After "Load failed" network error, issue a verification fetch to the prefill `GET` endpoint. If the row exists in the sheet, the submission succeeded — show the confirmation screen with the retrieved ID. Otherwise, show "Please check your email" fallback.

## Email Template & Branding

- Email template is in `private/Mailer.gs`.
- Instagram icon in footer should be centered via `text-align: center` (more reliable in email clients than flexbox).
- Always include resubmission notice if `updated: true`.
- Add-on pricing and total are displayed in the email body per the summary logic in `Mailer.gs`.

## Common Debugging Patterns

### Endpoint returns 404 on ALL deployment IDs simultaneously
- This is an OAuth scope re-auth issue, not a code problem.
- Run `reauthorizeAfterScopeChange()` from the Apps Script editor (not CLI) after updating `appsscript.json` scopes.
- Symptom: added a new scope (e.g., Gmail), then all `/exec` URLs return Google HTML "Page Not Found".

### Endpoint returns 404 on SOME deployment IDs
- Check that the frontend `FORM_API_URL` matches an actual callable web app deployment.
- Verify web-app "Who has access" setting is set to "Anyone".
- Check Squarespace wrapper is not dropping the `api` query param.

### Form loads but submit fails silently
- Check browser console for network errors or CORS blocking.
- Verify the `token` param is valid and not expired.
- Verify email matches the token (form rejects mismatches).

## Testing Protocol

- **Never use random external emails for testing.** Use `spshen2@hotmail.com` (optionally with `+tag` aliases like `spshen2+tag@hotmail.com`) so confirmations are visible in one inbox and no unintended recipients are contacted.
- After any deployment, run a smoke test: `GET ?action=generateLink&email=...&plan=...&weekStart=...` should return JSON with `success: true` and a `link` field.
- Test the full end-to-end flow (generate link, open in browser, load form, submit, verify email received) in the same browser and domain where users will use it (real domain for production testing).

## Codebase Layout

- `form.html`, `form.js`, `form.css` — Static frontend on GitHub Pages
- `private/Api.gs` — Main entry point (`doGet`, `doPost`, `doOptions`)
- `private/Security.gs` — Token generation/verification; form validation
- `private/SheetRepository.gs` — Read/write submissions; ID generation; resubmission matching
- `private/Mailer.gs` — Email template and sending logic
- `private/MenuService.gs` — Load menu options from the menu source sheet
- `private/Config.gs` — Plan definitions, security settings, pricing, branding
- `private/TokenHelper.gs` — Helper functions for generating/testing tokens locally

## Future Architecture: Customer Portal Integration

A separate customer portal project is planned to tie into this menu forms system. Consider:
- **Shared token validation:** Portal and menu form should use the same `Security.gs` token verification logic.
- **Shared sheet backend:** Both projects may read/write to related sheets (customers, plans, orders).
- **Reuse email systems:** Mailer patterns should be consistent.
- **Unified deployment strategy:** Both projects should follow the same "UI-create web app, do not CLI redeploy" pattern.

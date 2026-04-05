/**
 * API endpoints for Jackie's Supper Club menu form
 * Handles GET (prefill + menu data) and POST (submit) from Squarespace
 */

/**
 * GET ?token=xxx
 *   Validates token, fetches menu for the token's weekStart, returns:
 *   { email, plan, planConfig, weekStart, menuOptions }
 *
 * GET ?action=generateLink&email=xxx&plan=xxx&weekStart=xxx
 *   Admin helper: generates a signed form link
 *
 * GET (no params)
 *   Health check
 */
function doGet(e) {
  try {
    const evt = e || {};
    const params = evt.parameter || {};
    const headers = getCorsHeaders(evt.source || null);

    if (params.token) {
      return handlePrefillRequest(params.token, headers);
    }

    if (params.action === 'generateLink' && params.email && params.plan && params.weekStart) {
      return handleGenerateLinkRequest(
        params.email,
        params.plan,
        params.weekStart,
        params.fullName || params.name || '',
        params.baseUrl || '',
        headers
      );
    }

    return respond({ status: 'ok', version: '2.0', timestamp: new Date().toISOString() }, 200, headers);
  } catch (error) {
    console.error('doGet error:', error.message);
    return respond({ error: 'Server error' }, 500, getCorsHeaders(null));
  }
}

/**
 * POST  body: { token, data: { fullName, email, dinner1, dinner1Prep, ... } }
 */
function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    const headers = getCorsHeaders(e.source);

    if (!payload.token) {
      return respond({ error: 'Missing token' }, 401, headers);
    }

    const tokenData = verifyToken(payload.token);
    if (!tokenData) {
      return respond({ error: 'Invalid or expired token' }, 401, headers);
    }

    // Verify submitted email matches token
    const submittedEmail = ((payload.data && payload.data.email) || '').toLowerCase().trim();
    if (submittedEmail !== tokenData.email) {
      console.warn('Email mismatch', { token: tokenData.email, submitted: submittedEmail });
      return respond({ error: 'Email mismatch' }, 401, headers);
    }

    // Validate required fields against plan
    const validation = validateFormData(payload.data || {}, tokenData.plan);
    if (!validation.valid) {
      return respond({ error: 'Validation failed', details: validation.errors }, 400, headers);
    }

    // Append to sheet — pass full tokenData so metadata columns are populated
    const result = appendToSheet(payload.data || {}, tokenData);
    if (!result.success) {
      return respond({ error: 'Failed to save submission', details: result.error }, 500, headers);
    }

    debugLog('Submission saved', { plan: tokenData.plan, email: tokenData.email });

    return respond({ success: true, message: 'Submission received', submissionId: result.submissionId }, 200, headers);
  } catch (error) {
    console.error('doPost error:', error.message);
    return respond({ error: 'Server error' }, 500);
  }
}

function doOptions(e) {
  const evt = e || {};
  return respond({}, 200, getCorsHeaders(evt.source || null));
}

/**
 * Validate token, fetch menu for that week, return everything the frontend needs
 * to render the form without additional requests.
 */
function handlePrefillRequest(token, headers) {
  const tokenData = verifyToken(token);
  if (!tokenData) {
    return respond({ error: 'Invalid or expired token' }, 401, headers);
  }

  const planConfig = CONFIG.PLANS[tokenData.plan];
  if (!planConfig) {
    return respond({ error: 'Unknown plan in token' }, 400, headers);
  }

  // Load menu for the token's week
  let menuOptions;
  try {
    menuOptions = getMenuForWeek(tokenData.weekStart);
  } catch (err) {
    console.error('Menu load error:', err.message);
    return respond({ error: 'Could not load menu for this week' }, 500, headers);
  }

  debugLog('Prefill served', { plan: tokenData.plan, weekStart: tokenData.weekStart });

  return respond({
    success: true,
    prefillData: {
      email: tokenData.email,
      fullName: tokenData.fullName || '',
      plan: tokenData.plan,
      weekStart: tokenData.weekStart,
    },
    planConfig: {
      displayName: planConfig.displayName,
      dinnerCount: planConfig.dinnerCount,
      portions: planConfig.portions,
      showLunch: planConfig.showLunch,
    },
    menuOptions: {
      weekStart: menuOptions.weekStart,
      dinners: menuOptions.dinners,
      proteins: menuOptions.proteins,
    },
    formConfig: {
      prepOptions: CONFIG.PREP_OPTIONS,
      lunchKitOptions: CONFIG.LUNCH_KIT_OPTIONS,
      addonDinnerPricing: CONFIG.ADDON_DINNER_PRICING,
      addonLunchKitOptions: CONFIG.ADDON_LUNCH_KIT_OPTIONS,
      notesMaxChars: CONFIG.NOTES_MAX_CHARS,
    },
  }, 200, headers);
}

/**
 * Admin helper — generate a signed form link.
 * In production, add API-key / allowlist check before this.
 */
function handleGenerateLinkRequest(email, plan, weekStart, fullName, baseUrlOverride, headers) {
  const baseUrl = String(baseUrlOverride || '').trim() || CONFIG.FRONTEND_FORM_URL || ScriptApp.getService().getUrl();
  const link = generateFormLink(email, plan, weekStart, baseUrl, fullName);

  if (!link) {
    return respond({ error: 'Failed to generate link' }, 500, headers);
  }

  return respond({ success: true, link, email, fullName: fullName || '', plan, weekStart, baseUrl }, 200, headers);
}

/**
 * Build CORS headers, restricting origin if VERIFY_ORIGIN is enabled.
 */
function getCorsHeaders(requestSource) {
  let origin = '*';

  if (CONFIG.SECURITY.VERIFY_ORIGIN) {
    const referer = (requestSource && requestSource.headers && requestSource.headers.referer) || '';
    const match = referer.match(/https?:\/\/[^\/]+/);
    if (match && CONFIG.SECURITY.ALLOWED_ORIGINS.includes(match[0])) {
      origin = match[0];
    } else if (referer) {
      console.warn('Origin not in allowlist:', referer);
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

/**
 * Format response as JSON with CORS headers
 */
function respond(data, statusCode = 200, headers = {}) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // Apply headers if runtime supports it.
  // Some Apps Script runtimes for web apps do not expose setHeader on TextOutput.
  if (typeof output.setHeader === 'function') {
    for (const [key, value] of Object.entries(headers)) {
      output.setHeader(key, value);
    }
  }

  return output;
}

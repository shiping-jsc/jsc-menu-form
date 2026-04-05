/**
 * Security module for HMAC token generation and verification
 * Ensures only authorized clients can submit forms
 */

/**
 * Generate a signed token for a customer.
 * Payload includes email, plan, weekStart, and createdAt.
 *
 * @param {string} email       Customer email
 * @param {string} plan        Plan key (e.g. 'curated_individual')
 * @param {string} weekStart   Delivery week date as YYYY-MM-DD (or YYYYMMDD)
 * @param {string=} fullName   Optional recipient name
 * @return {object} {token, email, plan, weekStart, fullName, createdAt} or null on error
 */
function generateToken(email, plan, weekStart, fullName) {
  try {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email provided');
    }
    if (!plan || !CONFIG.PLANS[plan]) {
      throw new Error('Invalid plan: ' + plan);
    }
    if (!weekStart) {
      throw new Error('weekStart is required');
    }

    const payload = {
      email: email.toLowerCase().trim(),
      plan,
      weekStart,
      createdAt: new Date().toISOString(),
    };

    if (fullName && String(fullName).trim()) {
      payload.fullName = String(fullName).trim();
    }

    const payloadJson = JSON.stringify(payload);
    const signature = Utilities.computeHmacSha256Signature(
      payloadJson,
      CONFIG.SECURITY.HMAC_SECRET
    );
    const signatureEncoded = Utilities.base64Encode(
      signature.map(b => String.fromCharCode(b)).join('')
    );

    const token = `${Utilities.base64Encode(payloadJson)}.${signatureEncoded}`;

    debugLog('Token generated', { email, plan, weekStart });

    return {
      token,
      email: payload.email,
      plan,
      weekStart,
      fullName: payload.fullName || '',
      createdAt: payload.createdAt,
    };
  } catch (error) {
    console.error('Error generating token:', error.message);
    return null;
  }
}

/**
 * Verify a token and return the payload if valid
 * 
 * @param {string} token - Token to verify
 * @return {object} Payload {email, createdAt} or null if invalid/expired
 */
function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const [payloadEncoded, signatureProvided] = token.split('.');
    
    if (!payloadEncoded || !signatureProvided) {
      console.warn('Token format invalid');
      return null;
    }

    // Decode payload. Malformed payloads should be treated as invalid tokens.
    let payloadJson;
    let payload;
    try {
      const payloadBytes = Utilities.base64Decode(payloadEncoded);
      payloadJson = String.fromCharCode.apply(null, payloadBytes);
      payload = JSON.parse(payloadJson);
    } catch (decodeError) {
      console.warn('Token payload invalid');
      return null;
    }

    // Verify signature
    const expectedSignature = Utilities.computeHmacSha256Signature(
      payloadJson,
      CONFIG.SECURITY.HMAC_SECRET
    );
    const expectedSignatureEncoded = Utilities.base64Encode(
      expectedSignature.map(b => String.fromCharCode(b)).join('')
    );

    if (signatureProvided !== expectedSignatureEncoded) {
      console.warn('Token signature mismatch');
      return null;
    }

    // Check expiration
    const createdAt = new Date(payload.createdAt).getTime();
    const now = new Date().getTime();
    const age = now - createdAt;

    if (age > CONFIG.SECURITY.TOKEN_EXPIRATION_MS) {
      console.warn('Token expired');
      return null;
    }

    debugLog('Token verified', { email: payload.email, ageMs: age });

    return payload;
  } catch (error) {
    console.warn('Token verification failed');
    return null;
  }
}

/**
 * Create a prefilled form URL with signed token
 * 
 * @param {string} email - Customer email
 * @param {string} formId - Form identifier (e.g., 'order')
 * @param {string} baseUrl - Base URL of form (e.g., https://www.example.com/form)
 * @param {string=} fullName - Optional recipient name embedded in token
 * @return {string} Full URL with token parameter
 */
function generateFormLink(email, plan, weekStart, baseUrl, fullName) {
  try {
    const tokenData = generateToken(email, plan, weekStart, fullName);
    if (!tokenData) {
      throw new Error('Failed to generate token');
    }

    const separator = baseUrl.indexOf('?') === -1 ? '?' : '&';
    const fullUrl =
      baseUrl +
      separator +
      'token=' + encodeURIComponent(tokenData.token);

    debugLog('Form link generated', { email, plan, weekStart, url: fullUrl });

    return fullUrl;
  } catch (error) {
    console.error('Error generating form link:', error.message);
    return null;
  }
}

/**
 * Validate form submission data against the plan's required fields.
 *
 * @param {object} data  - Form submission fields
 * @param {string} plan  - Plan key
 * @return {object} {valid: boolean, errors: string[]}
 */
function validateFormData(data, plan) {
  const errors = [];

  try {
    const planConfig = CONFIG.PLANS[plan];
    if (!planConfig) {
      return { valid: false, errors: ['Unknown plan: ' + plan] };
    }

    // Email
    if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('email is required and must be valid');
    }

    // Full name
    if (!data.fullName || !data.fullName.trim()) {
      errors.push('fullName is required');
    }

    // Dinner selections + prep (required for all plans)
    for (let i = 1; i <= planConfig.dinnerCount; i++) {
      if (!data[`dinner${i}`]) errors.push(`dinner${i} is required`);
      if (!data[`dinner${i}Prep`]) errors.push(`dinner${i}Prep is required`);
    }

    // Lunch kit (required for curated plans)
    if (planConfig.showLunch) {
      if (!data.lunchKit) errors.push('lunchKit is required');
      // Protein required only for half/half option
      if ((data.lunchKit === 'half' || data.lunchKit === 'salad') && !data.lunchProtein) {
        errors.push('lunchProtein is required when lunchKit is half or salad');
      }
    }

    // Add-on validation (all optional, but internally consistent)
    if (data.wantsAddOns === 'yes') {
      // addOnDinners: if provided, must be a valid array with known qty values
      if (data.addOnDinners) {
        let addOnList = data.addOnDinners;
        if (typeof addOnList === 'string') {
          try { addOnList = JSON.parse(addOnList); } catch (e) {
            errors.push('addOnDinners must be a valid JSON array');
          }
        }
        if (Array.isArray(addOnList)) {
          addOnList.forEach(function(entry, idx) {
            if (!entry.item) errors.push('addOnDinners[' + idx + '].item is required');
            if (entry.portions !== 2 && entry.portions !== 4) {
              errors.push('addOnDinners[' + idx + '].portions must be 2 or 4');
            }
          });
        }
      }
      // Add-on lunch kit protein required when half/half selected
      if ((data.addOnLunchKit === 'half_4' || data.addOnLunchKit === 'salad_2' || data.addOnLunchKit === 'salad_4') && !data.addOnLunchProtein) {
        errors.push('addOnLunchProtein is required for salad/half add-on lunch kits');
      }
    }

    // Notes length cap
    if (data.notes && data.notes.length > CONFIG.NOTES_MAX_CHARS) {
      errors.push(`notes must be ${CONFIG.NOTES_MAX_CHARS} characters or fewer`);
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating form data:', error.message);
    return {
      valid: false,
      errors: ['Validation error: ' + error.message],
    };
  }
}

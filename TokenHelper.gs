/**
 * Wrapper for easy manual testing in Apps Script editor.
 * Usage: displayTestFormLink()
 */
function displayTestFormLink() {
  var email = 'spshen2@hotmail.com';
  var fullName = 'Shiping Shen';
  var plan = 'curated_individual';
  var weekStart = '2026-04-06';
  return displayFormLink(email, plan, weekStart, fullName);
}
/**
 * Token Generation Helper Script
 * Use this to generate signed form links to send to customers.
 *
 * Typical usage:
 *   generateFormLinkForCustomer('customer@example.com', 'curated_individual', '2026-04-06')
 *
 * The token encodes email + plan + weekStart so they cannot be tampered with.
 */

/**
 * Generate a signed form link for a customer.
 *
 * @param {string} email      Customer email
 * @param {string} plan       Plan key (e.g. 'curated_individual')
 * @param {string} weekStart  Delivery week as YYYY-MM-DD
 * @param {string=} fullName Optional recipient name
 * @param {string=} baseUrlOverride Optional frontend URL override (e.g. GitHub Pages form URL)
 * @return {string} Full URL with signed token
 */
function generateFormLinkForCustomer(email, plan, weekStart, fullName, baseUrlOverride) {
  try {
    if (!email) throw new Error('Email is required. Example: generateFormLinkForCustomer("customer@example.com", "curated_individual", "2026-04-06")');
    if (!plan)  throw new Error('Plan is required');
    if (!weekStart) throw new Error('weekStart is required (YYYY-MM-DD)');

    const deploymentUrl = ScriptApp.getService().getUrl();
    const baseUrl = String(baseUrlOverride || '').trim() || CONFIG.FRONTEND_FORM_URL || deploymentUrl;
    if (!baseUrl) {
      throw new Error('Web app URL not available. Deploy the script as a Web App first.');
    }

    const link = generateFormLink(email, plan, weekStart, baseUrl, fullName);
    if (!link) throw new Error('Failed to generate link');

    console.log('Generated form link:', link);
    return link;
  } catch (error) {
    console.error('Error generating form link:', error.message);
    throw error;
  }
}

/**
 * Batch-generate links from a column of emails.
 * Run from the Apps Script editor (standalone context).
 * Results are logged; copy from the Execution Log.
 *
 * @param {string} plan       Plan key for all rows
 * @param {string} weekStart  YYYY-MM-DD delivery week
 * @param {string[][]} emails Array of [email] rows (or call manually)
 */
function generateLinksFromSheet(plan, weekStart, emails) {
  if (!emails || !Array.isArray(emails)) {
    throw new Error('Pass an array of email strings, e.g. [["a@b.com"],["c@d.com"]]');
  }
  emails.forEach(function(row) {
    const email = String(row[0] || '').trim();
    if (!email) return;
    try {
      const link = generateFormLinkForCustomer(email, plan, weekStart);
      console.log(email + ' -> ' + link);
    } catch (err) {
      console.error(email + ' -> Error: ' + err.message);
    }
  });
}

/**
 * Full test of the token round-trip.
 * Run this after any Security.gs change.
 */
function testTokenGeneration() {
  try {
    console.log('Starting token generation test...');

    const testEmail = 'test@example.com';
    const testPlan  = 'curated_individual';
    const testWeek  = '2026-04-06';

    // Generate token
    const tokenData = generateToken(testEmail, testPlan, testWeek, 'Test User');
    if (!tokenData) throw new Error('Token generation failed');
    console.log('✓ Token generated:', tokenData.token.substring(0, 20) + '...');

    // Verify token
    const verified = verifyToken(tokenData.token);
    if (!verified) throw new Error('Token verification failed');
    if (verified.email !== testEmail)    throw new Error('Email mismatch in payload');
    if (verified.plan  !== testPlan)     throw new Error('Plan mismatch in payload');
    if (verified.weekStart !== testWeek) throw new Error('weekStart mismatch in payload');
    console.log('✓ Token verified:', verified);

    // Form link with dummy base URL (no deployment needed)
    const link = generateFormLink(testEmail, testPlan, testWeek, 'https://example.com/form', 'Test User');
    if (!link) throw new Error('Form link generation failed');
    console.log('✓ Form link generated:', link.substring(0, 60) + '...');

    // Confirm invalid token is rejected
    const invalid = verifyToken('invalid.token');
    if (invalid !== null) throw new Error('Invalid token was not rejected');
    console.log('✓ Invalid token correctly rejected');

    console.log('\n✓ All token tests passed!');
    return true;
  } catch (error) {
    console.error('✗ Token test failed:', error.message);
    throw error;
  }
}

/**
 * Standalone-safe helper to log a generated link.
 * Run from the Apps Script editor and check the Execution Log.
 *
 * @param {string} email
 * @param {string} plan       Plan key (e.g. 'curated_individual')
 * @param {string} weekStart  YYYY-MM-DD
 * @param {string=} fullName  Optional recipient name
 * @param {string=} baseUrlOverride Optional frontend URL override
 */
function displayFormLink(email, plan, weekStart, fullName, baseUrlOverride) {
  try {
    if (!email) throw new Error('Usage: displayFormLink("email@example.com", "curated_individual", "2026-04-06")');
    const link = generateFormLinkForCustomer(email, plan, weekStart, fullName, baseUrlOverride);
    console.log('Generated link:', link);
    return link;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

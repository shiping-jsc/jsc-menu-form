/**
 * Configuration file for Jackie's Supper Club Menu Form Integration
 */

const CONFIG = {
  // Google Sheets Configuration
  SHEETS: {
    // Where form submissions are written
    FORM_RESPONSES_FILE_ID: '19F3fBjcO7iFp155sihoV-SPSRqCnrATLEfxuxoIh7w4',
    FORM_RESPONSES_SHEET: 'Form Responses',

    // Menu source spreadsheet (Summary for Menu/Forms tab)
    MENU_FILE_ID: '1ufl9VJCEcXcWHMuNdj1_-MghUaYcSwe-CP4SunBtQsc',
    MENU_SHEET: 'Summary for Menu/Forms',
  },

  // Security Configuration
  SECURITY: {
    HMAC_SECRET: 'CHANGE_ME_TO_SECURE_RANDOM_STRING_32_CHARS_MIN',
    TOKEN_EXPIRATION_MS: 24 * 60 * 60 * 1000,
    VERIFY_ORIGIN: true,
    ALLOWED_ORIGINS: [
      'https://www.jackiessupperclub.com',
      'https://jackiessupperclub.squarespace.com',
      'https://shiping-jsc.github.io',
      'http://localhost:3000',
    ],
  },

  // Plan definitions
  // dinnerCount: number of dinner selections required
  // portions: serving size shown to user
  // showLunch: whether lutch kit section is displayed
  PLANS: {
    supplemental_individual: {
      key: 'supplemental_individual',
      displayName: 'Supplemental, Individual',
      dinnerCount: 2,
      portions: 2,
      showLunch: false,
    },
    supplemental_family: {
      key: 'supplemental_family',
      displayName: 'Supplemental, Family',
      dinnerCount: 2,
      portions: 4,
      showLunch: false,
    },
    curated_individual: {
      key: 'curated_individual',
      displayName: 'Curated, Individual',
      dinnerCount: 3,
      portions: 2,
      showLunch: true,
    },
    curated_family: {
      key: 'curated_family',
      displayName: 'Curated, Family',
      dinnerCount: 3,
      portions: 4,
      showLunch: true,
    },
  },

  // Add-on pricing for extra dinner portions (fully cooked only)
  ADDON_DINNER_PRICING: [
    { value: '2', label: '+2 portions', price: '$76' },
    { value: '4', label: '+4 portions', price: '$144' },
  ],

  // Add-on lunch kit options (separate from the plan's included lunch kit).
  // The 'half_4' value triggers the add-on protein question.
  ADDON_LUNCH_KIT_OPTIONS: [
    { value: 'soup_2',  label: '+2 portions soup',                   price: '$42' },
    { value: 'salad_2', label: '+2 portions salad',                  price: '$42' },
    { value: 'soup_4',  label: '+4 portions soup',                   price: '$84' },
    { value: 'salad_4', label: '+4 portions salad',                  price: '$84' },
    { value: 'half_4',  label: '+4 portions half soup / half salad', price: '$84' },
  ],

  // Prep options for regular dinner selections (constant, never change)
  PREP_OPTIONS: [
    { value: 'fully_cooked', label: 'Fully cooked (just reheat and assemble to eat)' },
    { value: 'finish_fresh', label: 'Finish it fresh (~15–20 min of cooking for best taste)' },
  ],

  // Lunch kit options for the main plan's included lunch kit (curated plans only).
  // 'half' triggers the plan lunch protein question.
  LUNCH_KIT_OPTIONS: [
    { value: 'salad', label: 'Salad' },
    { value: 'soup',  label: 'Soup' },
    { value: 'half',  label: 'Half salad / half soup (2 portions each)' },
  ],

  // Notes field character limit
  NOTES_MAX_CHARS: 500,

  // Environment
  // Public URL where form.html/form.js is hosted (e.g. your Squarespace page URL).
  // If empty, helper functions fall back to the Apps Script deployment URL.
  // Frontend URL used for generated links.
  FRONTEND_FORM_URL: 'https://shiping-jsc.github.io/jsc-menu-form/form.html',

  DEBUG: false,
};

/**
 * Log helper respecting DEBUG flag
 */
function debugLog(message, data = null) {
  if (CONFIG.DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

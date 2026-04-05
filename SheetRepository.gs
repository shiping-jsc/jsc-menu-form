/**
 * SheetRepository.gs
 * All Google Sheets read/write for form submissions.
 *
 * Fixed column schema (one row per submission, all plans share the same sheet):
 *
 *  submissionId | timestamp | weekStart | plan | email | fullName
 *  dinner1 | dinner1Prep | dinner2 | dinner2Prep | dinner3 | dinner3Prep
 *  lunchKit | lunchProtein
 *  wantsAddOns | addOnDinners (JSON: [{item, portions},...]) |
 *  addOnLunchKit | addOnLunchProtein (only if addOnLunchKit = 'half_4')
 *  notes | source
 *
 * Columns are always written in this order regardless of plan.
 * Columns not applicable to a plan are left blank.
 */

const SHEET_COLUMNS = [
  'submissionId',
  'timestamp',
  'weekStart',
  'plan',
  'email',
  'fullName',
  'dinner1',
  'dinner1Prep',
  'dinner2',
  'dinner2Prep',
  'dinner3',
  'dinner3Prep',
  'lunchKit',
  'lunchProtein',
  'wantsAddOns',
  'addOnDinners',
  'addOnLunchKit',
  'addOnLunchProtein',
  'notes',
  'source',
];

/**
 * Append a form submission to the responses sheet.
 *
 * @param {object} data       Form fields submitted by user
 * @param {object} tokenData  Verified token payload { email, plan, weekStart }
 * @return {object} { success, submissionId?, error? }
 */
function appendToSheet(data, tokenData) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEETS.FORM_RESPONSES_FILE_ID);
    const sheet = getOrCreateSheet(ss, CONFIG.SHEETS.FORM_RESPONSES_SHEET);

    if (sheet.getLastRow() === 0) {
      initializeSheetHeaders(sheet);
    }

    const submissionId = Utilities.getUuid();
    const timestamp = new Date().toISOString();

    // Build row in SHEET_COLUMNS order
    const row = SHEET_COLUMNS.map(col => {
      switch (col) {
        case 'submissionId': return submissionId;
        case 'timestamp':    return timestamp;
        case 'weekStart':    return tokenData.weekStart || '';
        case 'plan':         return tokenData.plan || '';
        case 'source':       return 'web';
        case 'addOnDinners': {
          const v = data.addOnDinners;
          if (!v) return '';
          // Accept array (from JSON body) or already-serialized string
          return Array.isArray(v) ? JSON.stringify(v) : String(v);
        }
        default:             return data[col] !== undefined ? data[col] : '';
      }
    });

    sheet.appendRow(row);

    debugLog('Row appended', { submissionId, plan: tokenData.plan });

    return { success: true, submissionId };
  } catch (error) {
    console.error('appendToSheet error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get sheet by name, or create it if it doesn't exist.
 */
function getOrCreateSheet(ss, sheetName) {
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

/**
 * Write the fixed header row and apply basic formatting.
 */
function initializeSheetHeaders(sheet) {
  sheet.appendRow(SHEET_COLUMNS);
  const headerRange = sheet.getRange(1, 1, 1, SHEET_COLUMNS.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f3f3');
  sheet.setFrozenRows(1);
  for (let i = 1; i <= SHEET_COLUMNS.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * Fetch the N most recent submissions (for debugging / verification).
 *
 * @param {number} limit
 * @return {object[]}
 */
function getRecentSubmissions(limit = 10) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEETS.FORM_RESPONSES_FILE_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.FORM_RESPONSES_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) return [];

    const lastRow = sheet.getLastRow();
    const startRow = Math.max(2, lastRow - limit + 1);
    const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, SHEET_COLUMNS.length).getValues();

    return values.map(row => {
      const obj = {};
      SHEET_COLUMNS.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  } catch (error) {
    console.error('getRecentSubmissions error:', error.message);
    return [];
  }
}

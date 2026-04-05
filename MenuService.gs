/**
 * MenuService.gs
 * Reads the weekly menu options from the "Summary for Menu/Forms" spreadsheet tab.
 *
 * Expected spreadsheet layout (row 1 = headers, row 2+ = weekly data):
 *   Col A: delivery date as YYYYMMDD
 *   Meat 1, Meat 2, Meat 3, Meat 4
 *   Veg 1,  Veg 2,  Veg 3,  Veg 4
 *   Salad Protein 1, Salad Protein 2, Salad Protein 3
 *   Snacks, Breakfast  (these are always ignored)
 *
 * Empty cells or cells containing "(empty)" are excluded from the returned lists.
 *
 * Returns:
 *   {
 *     weekStart:  "2026-04-06",    // from column A, formatted YYYY-MM-DD
 *     dinners:    [{ value, label, isVeg }],
 *     proteins:   [{ value, label }],
 *   }
 */

// Column headers we care about, in the order they appear in the sheet.
const MENU_DINNER_HEADERS = ['Meat 1', 'Meat 2', 'Meat 3', 'Meat 4', 'Veg 1', 'Veg 2', 'Veg 3', 'Veg 4'];
const MENU_PROTEIN_HEADERS = ['Salad Protein 1', 'Salad Protein 2', 'Salad Protein 3'];

/**
 * Return the menu for a given weekStart date string (YYYY-MM-DD or YYYYMMDD).
 * Pass null / undefined to get the most recent (latest) week.
 *
 * @param {string|null} weekStartParam  e.g. "2026-04-06" or "20260406"
 * @return {object}  { weekStart, dinners, proteins }
 */
function getMenuForWeek(weekStartParam) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEETS.MENU_FILE_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.MENU_SHEET);

    if (!sheet) {
      throw new Error(`Sheet "${CONFIG.SHEETS.MENU_SHEET}" not found in menu spreadsheet`);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      throw new Error('Menu spreadsheet has no data rows');
    }

    // Row 0 = headers, build column-index map
    const headers = data[0].map(h => String(h).trim());
    const colIndex = {};
    headers.forEach((h, i) => { colIndex[h] = i; });

    // Find the target data row
    const targetRow = findMenuRow(data, colIndex, weekStartParam);
    if (!targetRow) {
      throw new Error('No menu found for week: ' + weekStartParam);
    }

    // Parse the raw date in col A  → "YYYY-MM-DD"
    const rawDate = String(targetRow[0]).replace(/-/g, '').replace(/\//g, '').trim();
    const weekStart = formatDateString(rawDate);

    // Build dinner options list
    const dinners = [];
    MENU_DINNER_HEADERS.forEach(header => {
      const idx = colIndex[header];
      if (idx === undefined) return;
      const val = String(targetRow[idx] || '').trim();
      if (!val || val.toLowerCase() === '(empty)') return;
      const isVeg = header.toLowerCase().startsWith('veg');
      dinners.push({
        value: slugify(val),
        label: isVeg ? `(veg) ${val}` : val,
        isVeg,
      });
    });

    // Build protein options list
    const proteins = [];
    MENU_PROTEIN_HEADERS.forEach(header => {
      const idx = colIndex[header];
      if (idx === undefined) return;
      const val = String(targetRow[idx] || '').trim();
      if (!val || val.toLowerCase() === '(empty)') return;
      proteins.push({ value: slugify(val), label: val });
    });

    debugLog('Menu loaded', { weekStart, dinners: dinners.length, proteins: proteins.length });

    return { weekStart, dinners, proteins };

  } catch (error) {
    console.error('MenuService error:', error.message);
    throw error;
  }
}

/**
 * Find the data row that matches the requested week.
 * If weekStartParam is null/undefined, returns the row with the latest date.
 */
function findMenuRow(data, colIndex, weekStartParam) {
  const dateColIdx = 0; // always column A
  const dataRows = data.slice(1).filter(row => row[dateColIdx] !== '');

  if (!weekStartParam) {
    // Return the row with the latest date
    return dataRows.reduce((latest, row) => {
      const d = normalizeDate(String(row[dateColIdx]));
      const ld = latest ? normalizeDate(String(latest[dateColIdx])) : '';
      return d > ld ? row : latest;
    }, null);
  }

  const target = normalizeDate(weekStartParam);
  return dataRows.find(row => normalizeDate(String(row[dateColIdx])) === target) || null;
}

/**
 * Normalize a date string to YYYYMMDD for comparison.
 * Accepts: YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD
 */
function normalizeDate(str) {
  return str.replace(/[-\/]/g, '').trim().substring(0, 8);
}

/**
 * Format YYYYMMDD → YYYY-MM-DD
 */
function formatDateString(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length < 8) return yyyymmdd;
  return `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`;
}

/**
 * Convert a display label to a safe value slug, e.g. "Lemon Butter Salmon" → "lemon_butter_salmon"
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

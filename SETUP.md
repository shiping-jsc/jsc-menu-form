# Setup Checklist & Next Steps

This document shows what's been created and what you need to do next.

## ✅ What's Been Created

### Backend Files (Google Apps Script)
- ✓ `Config.gs` - Central configuration (NEEDS: Your sheet ID + HMAC secret)
- ✓ `Security.gs` - Token generation & verification
- ✓ `Api.gs` - HTTP handlers (GET/POST)
- ✓ `SheetRepository.gs` - Google Sheets operations
- ✓ `TokenHelper.gs` - Helper functions for token generation
- ✓ `appsscript.json` - Manifest (auto-managed)

### Frontend Files
- ✓ `form.html` - Responsive form template
- ✓ `form.js` - Form handler & submission logic
- ✓ `form.css` - Professional styling
- ✓ `formConfig.js` - Form configuration definitions (for multiple forms)

### Testing & Documentation
- ✓ `test.html` - **Interactive testing tool** (use this to validate everything)
- ✓ `README.md` - Full documentation
- ✓ `DEPLOYMENT.md` - Step-by-step deployment guide
- ✓ `QUICKSTART.md` - 5-minute quick reference
- ✓ `SETUP.md` - This file

---

## 🚀 Next Steps (In Order)

### Phase 1: Configuration (5 minutes)

**[ ] 1. Gather Required Information**
- [ ] Get your Google Sheet **File ID**
  - Open Sheet → URL: `https://docs.google.com/spreadsheets/d/{FILE_ID}/...`
  - Copy the FILE_ID part
- [ ] Generate a secure HMAC secret (32+ characters)
  - Use: Random string or `Utilities.getUuid() + Utilities.getUuid()`

**[ ] 2. Update Config.gs**
Edit `/Users/shipingshen/Documents/Delicata Kitchen/JSC-menu-forms/Config.gs`

Change these two lines:

```javascript
// Line ~5:
FORM_RESPONSES_FILE_ID: '19F3fBjcO7iFp155sihoV-SPSRqCnrATLEfxuxoIh7w4',
                         ↓
FORM_RESPONSES_FILE_ID: 'YOUR_SHEET_FILE_ID',

// Line ~12:
HMAC_SECRET: 'CHANGE_ME_TO_SECURE_RANDOM_STRING_32_CHARS_MIN',
             ↓
HMAC_SECRET: 'your-long-random-string-here',
```

### Phase 2: Deployment (10 minutes)

**[ ] 3. Create Google Apps Script Project**
1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename to "Squarespace-Forms"

**[ ] 4. Add Backend Files to Apps Script**

For each `.gs` file:
1. In Apps Script editor: Click **+ (New file)**
2. Name it (e.g., "Config")
3. Copy-paste the entire content from the file in JSC-menu-forms folder
4. Repeat for:
   - Config.gs
   - Security.gs
   - Api.gs
   - SheetRepository.gs
   - TokenHelper.gs

**[ ] 5. Test Backend Functions**

In Apps Script editor:
1. Select `testTokenGeneration` from function dropdown
2. Click **Run**
3. Check Execution log - should show ✓ All token tests passed!

**[ ] 6. Deploy as Web App**

1. Click **Deploy** (top right)
2. Click **New deployment** (⚙️ icon)
3. Set:
   - Type: **Web app**
   - Execute as: **Your Google Account**
   - Who has access: **Anyone**
4. Click **Deploy**
5. ⭐ **COPY THE URL** (you'll need it in next step)
   - Format: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercodeapp`

### Phase 3: Frontend Setup (5 minutes)

**[ ] 7. Update Frontend Files**

Edit `/Users/shipingshen/Documents/Delicata Kitchen/JSC-menu-forms/form.js`

Find line (~200):
```javascript
window.FORM_API_URL = 'YOUR_APPS_SCRIPT_DEPLOYMENT_URL';
```

Replace with your deployment URL:
```javascript
window.FORM_API_URL = 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercodeapp';
```

### Phase 4: Testing (5 minutes)

**[ ] 8. Run Interactive Tester**

1. Open `/Users/shipingshen/Documents/Delicata Kitchen/JSC-menu-forms/test.html` in browser
2. Enter your deployment URL
3. Click **Test Connection** (should show ✓ Connected!)
4. Click **Generate Token** (creates a test link)
5. Click **Test Prefill** (validates token)
6. Fill form and click **Submit Form** (saves to sheet)
7. ⭐ **Check your Google Sheet** - new row should appear!

### Phase 5: Customization (Your Time)

**[ ] 9. Customize Form Fields**

If you want different fields than the default:

**Edit `form.html`:**
- Find the form fields
- Add/remove/modify `<input>`, `<select>`, `<textarea>` elements
- Make sure `name` attributes match field names in Config.gs

**Edit `Config.gs` FORMS section:**
```javascript
ORDER_FORM: {
  formId: 'order',
  name: 'Order Form',
  fields: [
    { name: 'email', type: 'email', required: true, readOnly: true },
    { name: 'YOUR_FIELD', type: 'text', required: true },
    // Add your fields here
  ]
}
```

**Edit `form.js` - form group for your field:**
```html
<div class="form-group">
  <label for="yourField">Your Label</label>
  <input type="text" id="yourField" name="YOUR_FIELD" required />
</div>
```

**[ ] 10. Create Multiple Forms (If Needed)**

For each form (order, feedback, reservation, etc.):

1. Add config to `Config.gs` FORMS section
2. Create form HTML template (copy form.html, customize)
3. Update form.js API_URL
4. Generate links with different formIds:
   ```javascript
   generateFormLinkForCustomer('user@example.com', 'formIdHere')
   ```

### Phase 6: Integration (Your Setup)

### GitHub Pages Setup (Free, Recommended)

Use this if you want a fully hosted URL for `form.html` with unique token links.

1. Create a GitHub repository
  - Example repo name: `jsc-menu-form`
  - Keep this folder structure at repo root:
  - `form.html`
  - `form.js`
  - `form.css`

2. Publish with GitHub Pages
  - In GitHub repo: Settings > Pages
  - Source: Deploy from a branch
  - Branch: `main` and folder: `/ (root)`
  - Save
  - Your URL will be:
  - `https://YOUR_GITHUB_USERNAME.github.io/jsc-menu-form/form.html`

3. Update Apps Script config for generated links
  - In `Config.gs`, set:
  - `FRONTEND_FORM_URL: 'https://YOUR_GITHUB_USERNAME.github.io/jsc-menu-form/form.html'`

4. Add GitHub Pages origin to CORS allowlist
  - In `Config.gs` > `ALLOWED_ORIGINS`, add:
  - `https://YOUR_GITHUB_USERNAME.github.io`

5. Push + redeploy Apps Script backend
  - `npx @google/clasp push`
  - Redeploy your production deployment ID

6. Generate customer links and test
  - Each customer link should now start with your GitHub Pages URL and include `?token=...`
  - Open one link and submit; verify a row lands in your responses sheet

Tip: You can generate a one-off link against a specific frontend URL without changing config:

```javascript
generateFormLinkForCustomer(
  'customer@email.com',
  'curated_individual',
  '2026-04-06',
  'Customer Name',
  'https://YOUR_GITHUB_USERNAME.github.io/jsc-menu-form/form.html'
)
```

**[ ] 11. Choose Integration Method**

**Option A (Recommended): Squarespace page + external JS loader (Approach 2)**

This keeps your menu form auto-updating weekly while still using customer-specific token links.

1. Host frontend files externally (one-time)
  - Host `form.html`, `form.js`, `form.css` on Netlify/Vercel/GitHub Pages.
  - Example hosted form URL: `https://jsc-menu-form.netlify.app/form.html`

2. Create a dedicated Squarespace page
  - Create a new page called: `Menu Selection`
  - Set URL slug to: `/menu-selection`
  - Add one Code Block with this placeholder:

```html
<div id="jsc-menu-loader"></div>
```

3. Add page-level code injection in Squarespace
  - Open that page's **Settings > Advanced > Page Header Code Injection**
  - Paste this script (replace `YOUR_HOSTED_FORM_URL`):

```html
<script>
document.addEventListener('DOMContentLoaded', function () {
  var root = document.getElementById('jsc-menu-loader');
  if (!root) return;

  var token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
   root.innerHTML = '<p>Invalid link</p><p>Please use the menu selection form link provided in your email before the weekly deadline. If you have any questions, please contact operations@jackiessupperclub.com</p>';
   return;
  }

  var iframe = document.createElement('iframe');
  iframe.src = 'YOUR_HOSTED_FORM_URL?token=' + encodeURIComponent(token);
  iframe.style.width = '100%';
  iframe.style.minHeight = '2200px';
  iframe.style.border = '0';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  root.appendChild(iframe);
});
</script>
```

4. Update `Config.gs` so generated links point to Squarespace page
  - Set `FRONTEND_FORM_URL` to:
  - `https://www.delicatakitchen.com/menu-selection`
  - This ensures generated customer links look like:
  - `https://www.delicatakitchen.com/menu-selection?token=...`

5. Update origin allowlist in `Config.gs`
  - Ensure `ALLOWED_ORIGINS` contains both:
  - `https://www.delicatakitchen.com`
  - `https://delicatakitchen.squarespace.com` (if used)

6. Push + redeploy Apps Script
  - `npx @google/clasp push`
  - Redeploy your existing `/exec` deployment ID so production uses latest code.

7. Send links as usual
  - Continue generating one unique link per customer.
  - Token in URL is forwarded by Squarespace page into the embedded hosted form.
  - Menu options update automatically each week from your Apps Script backend + sheet.

**Option B: External Hosting (Flexible)**
1. Upload `form.html`, `form.js`, `form.css` to your web server
2. Update `Config.gs` ALLOWED_ORIGINS to include your domain
3. Link or embed the form

**Option C: Email Campaign (Distribution)**
1. Generate links programmatically:
   ```javascript
   generateFormLinkForCustomer('customer@example.com', 'order')
   ```
2. Email the link to customers
3. They click and see prefilled form

### Phase 7: Security (Before Production)

**[ ] 12. Security Review**

- [ ] Check HMAC_SECRET is strong and unique
- [ ] Verify ALLOWED_ORIGINS includes your domain
- [ ] Set `CONFIG.DEBUG = false` (line ~44 in Config.gs)
- [ ] Test with real customer data
- [ ] Review error messages (don't leak sensitive info)
- [ ] Check Google Sheet permissions
- [ ] Enable HTTPS everywhere (Squarespace does this automatically)

### Phase 8: Monitoring (Ongoing)

**[ ] 13. Set Up Monitoring**

- [ ] Check Apps Script > Executions occasionally for errors
- [ ] Monitor submissions in Google Sheet
- [ ] Set up Sheet notification rules if needed
- [ ] Back up your sheet regularly
- [ ] Keep deployment URL safe (anyone can submit)

---

## 📋 File Reference

### Files You MUST Update

| File | What to Change | Status |
|------|---|---|
| `Config.gs` | FORM_RESPONSES_FILE_ID, HMAC_SECRET | ⏳ TODO |
| `form.js` | window.FORM_API_URL | ⏳ TODO |
| `Config.gs` | ALLOWED_ORIGINS (your domain) | ⏳ TODO |

### Files You MIGHT Customize

| File | When to Edit |
|------|---|
| `form.html` | Change form fields/layout |
| `form.css` | Change styling to match brand |
| `formConfig.js` | Managing multiple forms |
| `Config.gs` | Add more form definitions |

### Files You DON'T Edit

| File | Why |
|------|---|
| `appsscript.json` | Auto-managed by Apps Script |
| `Api.gs` | Core backend logic |
| `Security.gs` | Core security logic |
| `SheetRepository.gs` | Core sheet operations |

---

## 💡 Quick Reference

### Generate a Form Link
```javascript
// In Apps Script console:
generateFormLinkForCustomer('customer@email.com', 'curated_individual', '2026-04-06', 'Customer Name')
```

### Check Recent Submissions
```javascript
// In Apps Script console:
getRecentSubmissions(10)
```

### Test Token
```javascript
// In Apps Script console:
testTokenGeneration()
```

### Change HMAC Secret (after deployment)
1. Update `Config.gs` line ~12
2. All previously generated links will STOP working (they're expired after 24h anyway)
3. Regenerate new links

---

## 🆘 Common Issues

### "File not found" when copying files
- Make sure you're in the JSC-menu-forms folder
- Files are in `/Users/shipingshen/Documents/Delicata Kitchen/JSC-menu-forms/`

### "Invalid Sheet ID" error
- Check File ID is exactly right (copy from URL, not sheet name)
- Verify you have edit access to the sheet

### "Deployment URL" not found
- After clicking Deploy > Deploy, look for the blue success message
- Copy from there (it's a long URL)
- If you can't find it, see DEPLOYMENT.md step 6

### Form not prefilling with email
- Check deployment URL is set in form.js
- Verify token is in the URL
- Check browser console for errors

### Submissions not saving
- Check sheet ID in Config.gs
- Verify Apps Script has Sheets permission (should auto-prompt)
- Check sheet exists with correct name ("Form Responses" by default)

---

## 📞 Need Help?

1. **Quick questions:** See QUICKSTART.md (5-minute overview)
2. **Detailed steps:** See DEPLOYMENT.md (step-by-step walkthrough)
3. **Full documentation:** See README.md (comprehensive guide)
4. **Testing:** Use test.html (interactive tester)
5. **Troubleshooting:** See README.md > Troubleshooting

---

## ✨ You're Ready!

Everything has been scaffolded and is ready to go. Follow the checklist above to get it live!

**Estimated total time:**
- Configuration: 5 min
- Deployment: 10 min
- Testing: 5 min
- Total: ~20 minutes before you have a working form!

---

**Questions?** Review the numbered Steps above in order, they're designed to be followed sequentially.

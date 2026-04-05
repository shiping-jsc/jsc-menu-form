# Deployment & Testing Guide

Complete step-by-step instructions for deploying the Squarespace Forms backend via Google Apps Script.

## Prerequisites

- Google Account with access to Google Drive, Sheets, and Apps Script
- Google Sheet created (see README.md)
- Familiarity with Google Apps Script editor

## Deployment Steps

### Step 1: Create Google Apps Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename to `Squarespace-Forms` (click project name at top)

### Step 2: Copy Backend Files

For each `.gs` file in this folder:
1. In Apps Script editor, click **+ (New file)**
2. Select **Script** or **Text** file
3. Paste content from:
   - `Config.gs`
   - `Security.gs`
   - `Api.gs`
   - `SheetRepository.gs`
   - `TokenHelper.gs`

**Do NOT manually copy `appsscript.json`** - it updates automatically.

### Step 3: Configure Settings

Edit `Config.gs`:

**Line ~5**: Update with your Sheet ID
```javascript
FORM_RESPONSES_FILE_ID: 'YOUR_SHEET_FILE_ID_HERE',
```

To find your Sheet ID:
1. Open your Google Sheet
2. URL: `https://docs.google.com/spreadsheets/d/{FILE_ID}/edit`
3. Copy the FILE_ID part

**Line ~12**: Set secure HMAC secret
```javascript
HMAC_SECRET: 'CHANGE_ME_TO_SECURE_RANDOM_STRING_32_CHARS_MIN',
```

Generate a secure secret:
1. In Apps Script console, run: `Utilities.getUuid()`
2. Copy output, run again, concatenate both
3. Example result: `3fa85f64-5717-4562-b3fc-2c963f66afa6a1b2c3d4e5f6g7h8i9j0`

**Line ~17**: Add your domain to CORS whitelist
```javascript
ALLOWED_ORIGINS: [
  'https://www.delicatakitchen.com',
  'https://delicatakitchen.squarespace.com',
  'http://localhost:3000', // For testing
],
```

### Step 4: Test Backend Functions

Before deploying, verify the backend works:

1. In Apps Script editor, click **Run** next to `testTokenGeneration`
2. Click **Review permissions** if prompted
3. Check **Execution log** at bottom - should show ✓ results

Expected output:
```
[DEBUG] Initializing form handler
✓ Token generated: eyJ...
✓ Token verified: {email: ..., createdAt: ...}
✓ Form link generated: https://script...
✓ Invalid token correctly rejected
✓ All token tests passed!
```

### Step 5: Deploy as Web App

1. Click **Deploy** (top right)
2. Click **New deployment** (icon: ⚙️)
3. **Deployment type**: Select **Web app**
4. **Execute as**: Select your Google Account
5. **Who has access**: Select **Anyone** (if internal, choose **Specific people**)
   - Note: CORS & tokens provide security despite "Anyone"
6. Click **Deploy**
7. Copy the **Deployment URL** (shown in dialog)
   - Format: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercodeapp`

⚠️ **Save this URL** - you'll need it for the frontend

### Step 6: Configure Frontend

Edit `form.js` (line ~200 or search for `FORM_API_URL`):

```javascript
window.FORM_API_URL = 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercodeapp';
```

Replace `YOUR_DEPLOYMENT_ID` with your deployment URL.

### Step 7: Host Frontend Files (Optional)

If using Squarespace custom HTML block:
1. You can embed directly in Squarespace
2. Or host on external server (AWS S3, Netlify, etc.)

For external hosting:
1. Upload `form.html`, `form.js`, `form.css` to your server
2. Update script src in HTML
3. Configure CORS in backend

## Testing

### Test 1: Token Generation

1. In Apps Script editor, go to **TokenHelper.gs**
2. Select function: `generateFormLinkForCustomer`
3. Click **Run**
4. Paste function into console:
   ```javascript
   generateFormLinkForCustomer('test@example.com', 'order')
   ```
5. Should return URL like:
   ```
   https://script.google.com/.../...?token=eyJ0eXBlIjoiam9zbiIsImFsZyI6IkhTMjU2In0.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTA1VDEwOjIyOjE3LjI1MVoifQ.xxx&form=order
   ```

### Test 2: Prefill Request

Open in browser:
```
https://script.google.com/.../...?token={YOUR_TOKEN}&form=order
```

Expected response (browser shows):
```json
{
  "success": true,
  "form": "order",
  "formName": "Order Form",
  "prefillData": {
    "email": "test@example.com"
  }
}
```

### Test 3: Form Submission

Use curl or Postman:

```bash
curl -X POST 'https://script.google.com/.../...' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "eyJ0eXBlIjoiam9zbiIsImFsZyI6IkhTMjU2In0.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTA1VDEwOjIyOjE3LjI1MVoifQ.xxx",
    "form": "order",
    "data": {
      "email": "test@example.com",
      "productSelection": "meal_plan_basic",
      "deliveryMethod": "pickup",
      "quantity": "1",
      "specialRequests": "No onions"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Submission received",
  "submissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Test 4: Check Sheet

1. Open your Google Sheet
2. New sheet tab should be created: "Form Responses"
3. Headers should be auto-populated
4. Last row should have your test submission

### Test 5: Full Browser Test

1. Generate a test link:
   ```javascript
   generateFormLinkForCustomer('test@example.com', 'order')
   ```

2. Copy the returned URL

3. Open in browser

4. Fill out and submit form

5. Check sheet for new row

## Updating After Deployment

To update backend code after deployment:

1. Edit `.gs` files in Apps Script editor
2. Click **Deploy** > **Manage deployments** (icon: 👁️)
3. Click pencil icon on active deployment
4. Click **Deploy** to save changes
5. ⚠️ Keep deployment URL the same (no new deployment needed)

To update frontend:

1. Edit `form.html`, `form.js`, `form.css`
2. If hosted externally, re-upload files
3. If in Squarespace, update custom HTML block
4. Clear browser cache if needed

## Troubleshooting

### "PERMISSION_DENIED" error
**Issue**: Apps Script can't access your Sheet
**Solution**:
1. Verify Sheet ID is correct in `Config.gs`
2. Ensure you have edit access to the Sheet
3. In Apps Script editor, review permissions:
   - Click settings icon (⚙️)
   - Check "Sheets API" is enabled

### "Invalid token" during test
**Issue**: Token expired or HMAC_SECRET changed
**Solution**:
1. Generate a fresh token (old ones expire in 24 hours)
2. Verify HMAC_SECRET hasn't changed
3. Run `testTokenGeneration()` to verify configuration

### Form fields not submitting
**Issue**: Field names don't match configuration
**Solution**:
1. Verify `name` attributes in `form.html` match `Config.gs` fields
2. Check browser console for validation errors
3. Run validation manually:
   ```javascript
   validateFormData({
     email: 'test@example.com',
     productSelection: 'meal_plan_basic'
   }, 'order')
   ```

### CORS errors in browser console
**Issue**: Request blocked by browser
**Solution**:
1. Check ALLOWED_ORIGINS in `Config.gs`
2. Verify exact domain including protocol:
   - ✓ `https://www.example.com`
   - ✗ `https://www.example.com/`
   - ✗ `www.example.com`

### Changes not reflecting
**Issue**: Old version is cached
**Solution**:
1. Check you deployed the changes
2. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Clear browser storage: DevTools > Application > Storage > Clear all

## Performance Optimization

For high-volume submissions:

1. **Batch Writes**: Modify `SheetRepository.gs` to batch append rows
2. **Indexing**: Add named ranges in Sheet for faster lookups
3. **Caching**: Add `SpreadsheetApp.getActiveSpreadsheet().getRangeByName()` caching
4. **Monitoring**: Use Apps Script quota dashboard

## Security Checklist

- [ ] HMAC_SECRET is unique and strong (32+ chars)
- [ ] HMAC_SECRET is NOT in version control
- [ ] ALLOWED_ORIGINS restricted to your domains
- [ ] Sheet has appropriate sharing permissions
- [ ] No debug logging in production (`CONFIG.DEBUG = false`)
- [ ] Token expiration appropriate for use case
- [ ] Admin endpoints (`generateLink`) have rate limiting
- [ ] Responses don't leak sensitive data (check error messages)
- [ ] HTTPS enabled everywhere (enforced by Squarespace)

## Next Steps

1. ✓ Deployment complete
2. Move to Squarespace integration:
   - Create custom HTML block with form.html
   - Update CORS origins if needed
3. Add monitoring:
   - Check Apps Script execution logs regularly
   - Set up Sheet notifications for new submissions
4. Plan for multiple forms:
   - Define form configs in Config.gs
   - Create separate HTML templates per form

## Support

**Apps Script Deployment Issues**:
- Check [script.google.com/a/v](/console/cloud/?projectselector=__NONE__) console
- Review Executions tab for error logs
- Search Google's [Apps Script documentation](https://developers.google.com/apps-script)

**Integration Issues**:
- Verify all files copied correctly
- Check CORS headers in API responses
- Review Security.gs token functions

**Squarespace Integration**:
- Use Squarespace custom HTML blocks
- Ensure form.js API URL is set correctly
- Test with browser DevTools Network tab

---

Deployment should be complete! Your form is now live and ready to receive submissions.

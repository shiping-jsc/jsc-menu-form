# Squarespace + Google Sheets Integration

A production-ready Forms backend built with Google Apps Script, designed for Squarespace custom HTML form integration with token-based, secure email prefilling.

## Overview

This project scaffold provides:

- **Secure Backend**: HMAC-SHA256 token-based authentication for form access
- **Email Prefilling**: Customers receive links with signed tokens that prefill their email (readonly)
- **Google Sheets Integration**: Form submissions are automatically appended to a specified sheet
- **CORS Configured**: Safe cross-origin requests from Squarespace
- **Frontend Example**: Responsive HTML form with JavaScript form handler
- **Modular Code**: Well-organized, production-safe architecture

## Architecture

```
┌─────────────────────────────────────────┐
│  Squarespace Custom HTML Block          │
│  (form.html + form.js + form.css)       │
└────────────────┬────────────────────────┘
                 │ HTTPS Request
                 ▼
┌─────────────────────────────────────────┐
│  Google Apps Script Web App              │
│  - Api.gs (doGet/doPost)                │
│  - Security.gs (Token verify)           │
│  - Config.gs (Settings)                 │
│  - SheetRepository.gs (Sheet write)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Google Sheets (Form Responses)         │
└─────────────────────────────────────────┘
```

## File Structure

### Backend (Google Apps Script)
- `Config.gs` - Configuration, sheet IDs, security settings
- `Security.gs` - Token generation, verification, validation
- `Api.gs` - HTTP request handlers (doGet, doPost)
- `SheetRepository.gs` - Google Sheets operations
- `TokenHelper.gs` - Helper utilities for token generation
- `appsscript.json` - Apps Script manifest

### Frontend (HTML/CSS/JS)
- `form.html` - Example form structure (for Squarespace)
- `form.js` - Form handler, token validation, submission logic
- `form.css` - Responsive styling
- `formConfig.js` - (Optional) Form field configuration

### Documentation
- `README.md` - This file
- `DEPLOYMENT.md` - Detailed deployment & testing guide

## Quick Start

### 1. Set Up Google Sheet

Create a new Google Sheet or use an existing one:
- Note the **File ID** from the URL: `https://docs.google.com/spreadsheets/d/{FILE_ID}/edit`
- Update `Config.gs`, line: `FORM_RESPONSES_FILE_ID: '19F3fBjcO7iFp155sihoV-SPSRqCnrATLEfxuxoIh7w4'`

### 2. Configure Security

Edit `Config.gs`:
- **HMAC_SECRET**: Replace with a secure random string (32+ characters)
  - Generate with: `Utilities.getUuid() + Utilities.getUuid()`
- **ALLOWED_ORIGINS**: Add your Squarespace domain
  - Example: `https://www.delicatakitchen.com`

### 3. Deploy as Web App

See `DEPLOYMENT.md` for detailed deployment steps.

### 4. Get Deployment URL

After deployment, copy the **Web App URL**:
- Format: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercodeapp`

### 5. Integration

#### Option A: Direct Squarespace Custom HTML Block
1. Navigate to Squarespace site settings
2. Add Custom HTML block
3. Copy `form.html` content
4. Update `form.js` configuration:
   ```javascript
   window.FORM_API_URL = 'YOUR_APPS_SCRIPT_DEPLOYMENT_URL';
   ```

#### Option B: Hosted Form (Recommended)
1. Host `form.html`, `form.js`, `form.css` on your server
2. Reference in Squarespace via `<iframe>` or link
3. Configure CORS in `Config.gs`

### 6. Generate Customer Links

Use `TokenHelper.gs` to generate links:

```javascript
// In Apps Script editor console:
generateFormLinkForCustomer('customer@example.com', 'order')

// Returns: https://script.google.com/...?token=xxx&form=order
```

Or use the web API:
```
GET https://your-deployment-url/?action=generateLink&email=user@example.com&form=order
```

## Configuration

### Customize Form Fields

Edit `Config.gs`, `FORMS.ORDER_FORM.fields`:

```javascript
fields: [
  { name: 'email', type: 'email', required: true, readOnly: true },
  { name: 'productSelection', type: 'dropdown', required: true },
  { name: 'quantity', type: 'number', required: true },
  { name: 'specialRequests', type: 'textarea', required: false },
]
```

### Add Multiple Forms

In `Config.gs`:
```javascript
FORMS: {
  ORDER_FORM: { /* ... */ },
  FEEDBACK_FORM: {
    formId: 'feedback',
    name: 'Feedback Form',
    fields: [
      { name: 'rating', type: 'radio', required: true },
      // ...
    ]
  }
}
```

### Update HTML Form

Edit `form.html` to match your fields:
```html
<input type="text" name="fieldName" />
```

Make sure `name` attributes match `Config.gs` field names.

## Security Considerations

⚠️ **Important before production:**

1. **Change HMAC_SECRET** - Use strong, unique value
2. **HTTPS Only** - Never send tokens over unencrypted connections
3. **Token Expiration** - Default 24 hours; adjust in `Config.gs`
4. **CORS Verification** - Enable and restrict to your domains
5. **Admin API Protection** - Add authentication to `generateLink` endpoint
6. **Sheet Permissions** - Only share with trusted team members
7. **Error Logging** - Monitor `Apps Script` logs for suspicious behavior

## Troubleshooting

### "Invalid token" error
- Token expired (24-hour window by default)
- HMAC_SECRET mismatch between generation and verification
- Token was tampered with

### Form not prefilling
- Token not included in URL
- Deployment URL not updated in `form.js`
- CORS blocked (check browser console)

### Submissions not appearing in Sheet
- Sheet doesn't exist (will be created automatically)
- File ID incorrect in `Config.gs`
- Permission issues - ensure Apps Script has Sheets access

### CORS errors
- Check `ALLOWED_ORIGINS` in `Config.gs`
- Ensure full origin included: `https://www.example.com` (not `https://www.example.com/`)
- Browser console shows `Access-Control-Allow-Origin` response

## Testing

Run tests in Apps Script editor:
```javascript
testTokenGeneration()
```

Or test the API directly:
```bash
# Test prefill
curl 'https://your-deployment-url/?token=xxx&form=order'

# Test submission
curl -X POST 'https://your-deployment-url/' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "xxx",
    "form": "order",
    "data": {
      "email": "test@example.com",
      "productSelection": "meal_plan_basic",
      ...
    }
  }'
```

## API Reference

### GET - Prefill Data
```
GET ?token={token}&form={formId}

Response:
{
  "success": true,
  "form": "order",
  "formName": "Order Form",
  "prefillData": {
    "email": "user@example.com"
  }
}
```

### POST - Submit Form
```
POST
Content-Type: application/json

{
  "token": "xxx",
  "form": "order",
  "data": {
    "email": "user@example.com",
    "productSelection": "meal_plan_basic",
    ...
  }
}

Response:
{
  "success": true,
  "message": "Submission received",
  "submissionId": "uuid"
}
```

### GET - Generate Link (Admin)
```
GET ?action=generateLink&email={email}&form={formId}

Response:
{
  "success": true,
  "link": "https://...",
  "email": "user@example.com",
  "formId": "order"
}
```

## Customization Examples

### Multiple Forms
1. Define form configs in `Config.gs`
2. Create form-specific HTML (form-feedback.html)
3. Generate links with different formIds

### Pre-validation Webhooks
1. Add validation service in `Api.gs` doPost
2. Call external API before sheet write
3. Return validation errors to client

### Email Notifications
1. Add `Mailer.gs` with `GmailApp` or `MailApp`
2. Send confirmation email in `Api.gs` after successful submission

### Advanced Analytics
1. Read submissions with `getRecentSubmissions()`
2. Process and aggregate data
3. Generate reports

## Support & Troubleshooting

For issues:
1. Check `Apps Script` > `Executions` for error logs
2. Enable debug logging: `CONFIG.DEBUG = true`
3. Review browser console for client-side errors
4. Verify HMAC_SECRET hasn't changed
5. Test token generation with `testTokenGeneration()`

## Production Checklist

- [ ] HMAC_SECRET changed to secure value
- [ ] Sheet permissions reviewed
- [ ] CORS origins configured
- [ ] Form fields customized
- [ ] Deployment tested end-to-end
- [ ] Error handling reviewed
- [ ] HTTPS enforced
- [ ] Admin endpoints protected
- [ ] Monitoring/logging in place
- [ ] Backup strategy for sheets

## License

This project is provided as-is for internal use.

---

**Next Steps:**
1. Read `DEPLOYMENT.md` for detailed deployment walkthrough
2. Customize `Config.gs` for your use case
3. Update `form.html` with your fields
4. Deploy and test!

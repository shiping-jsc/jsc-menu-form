# Quick Start Guide

Get your Squarespace-to-Google Sheets form integration live in 15 minutes.

## 📋 Files Overview

### Backend (Google Apps Script - `.gs` files)
| File | Purpose |
|------|---------|
| `Config.gs` | Configuration & form definitions |
| `Security.gs` | Token generation/verification, validation |
| `Api.gs` | HTTP endpoints (doGet/doPost) |
| `SheetRepository.gs` | Google Sheets read/write |
| `TokenHelper.gs` | Link generation helpers |
| `appsscript.json` | Metadata (auto-managed) |

### Frontend (HTML/CSS/JS - local files)
| File | Purpose |
|------|---------|
| `form.html` | Form structure & layout |
| `form.js` | Form logic, validation, submission |
| `form.css` | Responsive styling |
| `formConfig.js` | (Optional) Form field definitions |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `DEPLOYMENT.md` | Step-by-step deployment guide |
| `QUICKSTART.md` | This file |

## 🚀 5-Minute Setup

### 1. **Get Sheet ID**
```
Open your Google Sheet
Copy from URL: https://docs.google.com/spreadsheets/d/{FILE_ID}/edit
                                                   ↑ this part
```

### 2. **Create Apps Script Project**
- Go to [script.google.com](https://script.google.com)
- Click **New project**
- Rename to "Squarespace-Forms"

### 3. **Add Files to Apps Script**
```
For each .gs file in this folder:
1. Click + (New file)
2. Paste the content
3. Save
```

Files to add:
- Config.gs
- Security.gs
- Api.gs
- SheetRepository.gs
- TokenHelper.gs

### 4. **Configure (2 changes)**

In `Config.gs`:
```javascript
// Line ~5: Your sheet ID
FORM_RESPONSES_FILE_ID: '19F3fBjcO7iFp155sihoV-SPSRqCnrATLEfxuxoIh7w4'
                         ↓ CHANGE THIS

// Line ~12: Secure random string (32+ chars)
HMAC_SECRET: 'CHANGE_ME_TO_SECURE_RANDOM_STRING_32_CHARS_MIN'
              ↓ CHANGE THIS
```

### 5. **Test** (1 command)
```
In Apps Script editor:
Run → testTokenGeneration()
```
Should show: ✓ All token tests passed!

### 6. **Deploy**
```
Deploy → New deployment
Type: Web app
Execute as: [Your Account]
Access: Anyone
Deploy
↓ SAVE THIS URL
https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercodeapp
```

### 7. **Configure Frontend**

In `form.js` (search for `FORM_API_URL`):
```javascript
window.FORM_API_URL = 'https://script.google.com/...'
                       ↓ PASTE YOUR DEPLOYMENT URL
```

### 8. **Generate a Test Link**
```javascript
// In Apps Script console:
generateFormLinkForCustomer('customer@example.com', 'order')
```

Copy the URL → open in browser → test form!

## 🔧 Customization

### Add Your Form Fields

**Edit `form.html`:**
```html
<input type="text" name="fieldName" placeholder="..." />
```

**Edit `Config.gs`:**
```javascript
fields: [
  { name: 'fieldName', type: 'text', required: true },
  // ...
]
```

**Supported field types:** `email`, `text`, `number`, `dropdown`/`select`, `radio`, `textarea`, `date`, `time`, `checkbox`

### Add Multiple Forms

**In `Config.gs`:**
```javascript
FORMS: {
  ORDER_FORM: { /* ... */ },
  FEEDBACK_FORM: {
    formId: 'feedback',
    name: 'Feedback Form',
    fields: [ /* ... */ ]
  }
}
```

**Generate links with different formIds:**
```javascript
generateFormLinkForCustomer('user@example.com', 'feedback')
generateFormLinkForCustomer('user@example.com', 'order')
```

## 🔐 Security Checklist

Before production:
- [ ] Changed HMAC_SECRET to random value
- [ ] Added your domain to ALLOWED_ORIGINS
- [ ] Verified Sheet permissions
- [ ] Tested end-to-end
- [ ] Set CONFIG.DEBUG = false

## 🧪 Quick Tests

### Test Token Generation
```javascript
generateFormLinkForCustomer('test@example.com', 'order')
```

### Test Prefill
```
https://your-deployment-url/?token={TOKEN}&form=order
```
Expected: JSON with prefilled email

### Test Submit (with curl)
```bash
curl -X POST 'https://your-deployment-url/' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "xxx",
    "form": "order",
    "data": {
      "email": "test@example.com",
      "productSelection": "meal_plan_basic",
      "deliveryMethod": "pickup",
      "quantity": 1,
      "specialRequests": ""
    }
  }'
```
Expected: `{"success": true, "submissionId": "..."}`

### Check Sheet
Open your Google Sheet → new "Form Responses" tab with your test data

## 📝 Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid token" | Generate fresh token (old ones expire in 24h) |
| Form not prefilling | Verify DEPLOYMENT_URL in form.js |
| Submissions not saving | Check Sheet ID in Config.gs |
| CORS errors | Add your domain to ALLOWED_ORIGINS |
| Changes not showing | Hard refresh (Cmd+Shift+R) |

## 📚 Next Steps

1. **Read full docs:** See `README.md` and `DEPLOYMENT.md`
2. **Multiple forms:** Define in `Config.gs` FORMS section
3. **Advanced:** Add webhooks, email notifications, etc.
4. **Monitoring:** Check Apps Script > Executions for logs

## 🎯 For Squarespace Integration

### Option A: Direct Embed
1. Add custom HTML block to Squarespace
2. Copy `form.html` content
3. Update API URL in the html
4. Done!

### Option B: External Host
1. Upload `form.html`, `form.js`, `form.css` to Web server
2. Update CORS in `Config.gs`
3. Embed via `<iframe>` or link

### Option C: Squarespace Form + Custom Code
Use form links in email campaigns:
```
https://your-deployment-url/?token={TOKEN}&form=order
```

## 💡 Pro Tips

- Use `formConfig.js` to manage multiple form definitions
- Enable `CONFIG.DEBUG = true` during development
- Generate batch links from Google Sheet (see TokenHelper.gs)
- Monitor Apps Script executions for errors
- Back up your Google Sheet regularly
- Use different sheets per form for organization

## 🆘 Help

**Detailed deployment guide:** See `DEPLOYMENT.md` for step-by-step walkthrough

**Troubleshooting:** See `README.md` > Troubleshooting section

**API Reference:** See `README.md` > API Reference section

---

**Status:** ✓ Ready to deploy!

Next: Follow `DEPLOYMENT.md` for detailed step-by-step instructions.

/**
 * ============================================================================
 * KISAN MITRA — ALL-IN-ONE GOOGLE APPS SCRIPT
 * Automatic Google Sheet Generator + Gmail Notification + Webhook API
 * ============================================================================
 * 
 * FEATURES:
 * 1. AUTOMATIC SHEET GENERATION: No manual sheet creation required! If no sheet
 *    exists, the script creates "Kisan Mitra — Farmer Support & Submissions"
 *    in your Google Drive, formats headers, sets dropdowns, and saves the ID.
 * 2. GMAIL INTEGRATION: Sends an instant, beautifully styled HTML email notification
 *    to your Gmail (ismparam786@gmail.com / active account) with a clickable
 *    "Call Farmer" button and direct link to the Google Sheet.
 * 3. SUPPORTS BOTH POST AND GET:
 *    - POST: Receives submissions from Kisan Mitra web app (JSON / text / form).
 *    - GET: Shows a live status dashboard when opened in a browser with a link
 *      to your Google Sheet and recorded statistics.
 * 4. ONE-CLICK TEST: Run `testFullFlow()` to generate the sheet and test email.
 *
 * ----------------------------------------------------------------------------
 * 3-STEP SETUP GUIDE:
 * ----------------------------------------------------------------------------
 * 1. Open Google Apps Script:
 *    👉 Visit https://script.google.com/home/start and click "+ New project".
 * 2. Paste this entire code, replace any template code, and click 💾 Save.
 * 3. Click "Deploy" (top-right) → "New deployment":
 *    - Select type: "Web app" (gear icon ⚙️)
 *    - Description: Kisan Mitra Submissions API
 *    - Execute as: "Me" (your Gmail account)
 *    - Who has access: "Anyone"  <-- CRITICAL for accepting submissions!
 *    - Click "Deploy" and authorize the permissions when prompted.
 * 4. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...)
 *    and paste it in your `.env.local` as `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`.
 * ============================================================================
 */

// ── CONFIGURATION ────────────────────────────────────────────────────────────
const CONFIG = {
  // If left blank, it automatically creates a new Sheet in your Google Drive
  // and remembers it across all future submissions.
  // (You can also paste an existing Sheet ID here if you want to use a specific one)
  SPREADSHEET_ID: '',

  // Name of the tab inside the spreadsheet
  SHEET_TAB_NAME: 'Submissions',

  // Spreadsheet Title (used when auto-creating the sheet)
  SPREADSHEET_TITLE: 'Kisan Mitra — Farmer Support & Submissions',

  // Email to receive submission alerts (defaults to your logged-in Gmail)
  FALLBACK_EMAIL: 'ismparam786@gmail.com',

  // Timezone for formatting timestamps
  TIMEZONE: 'Asia/Kolkata',
};

/**
 * Gets the configured or auto-generated Spreadsheet.
 * If none exists, it generates a brand new Google Sheet in Drive and saves its ID.
 */
function getOrCreateSpreadsheet() {
  // 1. Check if the script is bound to a container spreadsheet
  const activeSs = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSs) {
    return activeSs;
  }

  // 2. Check CONFIG
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log('Could not open spreadsheet by CONFIG.SPREADSHEET_ID, falling back...');
    }
  }

  // 3. Check Script Properties (persisted across executions)
  const scriptProps = PropertiesService.getScriptProperties();
  const savedId = scriptProps.getProperty('KM_SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {
      Logger.log('Previously stored Spreadsheet ID invalid or deleted. Creating a new one...');
    }
  }

  // 4. Auto-generate brand new Spreadsheet on your Google Drive!
  Logger.log('Generating new Google Sheet: ' + CONFIG.SPREADSHEET_TITLE);
  const newSs = SpreadsheetApp.create(CONFIG.SPREADSHEET_TITLE);
  scriptProps.setProperty('KM_SPREADSHEET_ID', newSs.getId());
  Logger.log('✅ Sheet successfully created! URL: ' + newSs.getUrl());

  return newSs;
}

/**
 * Initializes and styles the Submissions sheet with headers, colors, and dropdowns.
 */
function getOrCreateSheetTab(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_TAB_NAME);

    // Delete default 'Sheet1' if it's empty
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
      try {
        if (defaultSheet.getLastRow() === 0) ss.deleteSheet(defaultSheet);
      } catch (err) { }
    }

    // Set Column Headers
    const headers = [
      'Timestamp (IST)',
      'Farmer Name',
      'Mobile Number',
      'Category',
      'Message',
      'Status',
      'Source',
    ];
    sheet.appendRow(headers);

    // Style the Header Row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1B4D3E'); // Dark Green (Kisan brand)
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    // Set Column Widths for clean layout
    sheet.setColumnWidth(1, 170); // Timestamp
    sheet.setColumnWidth(2, 190); // Farmer Name
    sheet.setColumnWidth(3, 150); // Mobile
    sheet.setColumnWidth(4, 130); // Category
    sheet.setColumnWidth(5, 420); // Message
    sheet.setColumnWidth(6, 140); // Status
    sheet.setColumnWidth(7, 150); // Source

    // Enable text wrapping for Message column
    sheet.getRange('E:E').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

    // Status Column Validation Dropdown (Col F)
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pending Review', 'In Progress', 'Resolved', 'Closed'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('F2:F1000').setDataValidation(statusRule);
  }

  return sheet;
}

/**
 * Sends a rich, professional HTML email alert to your Gmail.
 */
function sendEmailAlert(data, spreadsheetUrl) {
  try {
    let recipientEmail = '';
    try {
      recipientEmail = Session.getEffectiveUser().getEmail();
    } catch (e) { }

    if (!recipientEmail || recipientEmail.indexOf('@') === -1) {
      recipientEmail = CONFIG.FALLBACK_EMAIL;
    }

    const farmerName = data.farmerName || 'Farmer';
    const mobile = data.mobile || 'N/A';
    const cleanMobile = mobile.replace(/\s+/g, '');
    const messageType = data.messageType || 'General Inquiry';
    const message = data.message || '(No message content provided)';
    const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd MMM yyyy, hh:mm:ss a (z)');

    // Category Color & Priority Badge
    let badgeBg = '#EFF6FF';
    let badgeColor = '#1E40AF';
    let badgeBorder = '#BFDBFE';
    let priorityPrefix = '🌱 [Kisan Mitra]';

    if (messageType.toLowerCase() === 'grievance') {
      badgeBg = '#FEF2F2';
      badgeColor = '#991B1B';
      badgeBorder = '#FECACA';
      priorityPrefix = '🚨 [URGENT GRIEVANCE]';
    } else if (messageType.toLowerCase() === 'suggestion') {
      badgeBg = '#ECFDF5';
      badgeColor = '#065F46';
      badgeBorder = '#A7F3D0';
      priorityPrefix = '💡 [SUGGESTION]';
    }

    const subject = `${priorityPrefix} New ${messageType} from ${farmerName} (${mobile})`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #1B4D3E 0%, #2D6A4F 100%); color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #D8F3DC; }
          .content { padding: 24px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; margin-bottom: 16px; }
          .card { background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; padding: 16px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-weight: 500; }
          .val { color: #111827; font-weight: 600; text-align: right; }
          .message-box { background: #ffffff; border-left: 4px solid #2D6A4F; padding: 14px 16px; border-radius: 4px; margin-top: 8px; font-size: 14px; line-height: 1.6; color: #374151; font-style: italic; }
          .actions { text-align: center; margin: 24px 0 8px 0; }
          .btn-sheet { display: inline-block; background-color: #1B4D3E; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin-right: 8px; }
          .btn-call { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; }
          .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌾 Kisan Mitra — Support Portal</h1>
            <p>A Government of India Procurement Initiative</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">${messageType} Received</span>
            </div>
            
            <div class="card">
              <div class="row">
                <span class="label">Farmer Name:</span>
                <span class="val">${farmerName}</span>
              </div>
              <div class="row">
                <span class="label">Mobile Number:</span>
                <span class="val"><a href="tel:${cleanMobile}" style="color:#0284c7; text-decoration:none;">${mobile}</a></span>
              </div>
              <div class="row">
                <span class="label">Category:</span>
                <span class="val">${messageType}</span>
              </div>
              <div class="row">
                <span class="label">Submission Time:</span>
                <span class="val">${timestamp}</span>
              </div>
              <div style="padding-top: 12px;">
                <span class="label" style="display:block; margin-bottom: 4px;">Farmer's Message:</span>
                <div class="message-box">"${message}"</div>
              </div>
            </div>

            <div class="actions">
              <a href="${spreadsheetUrl}" class="btn-sheet" target="_blank">📊 Open Google Sheet</a>
              <a href="tel:${cleanMobile}" class="btn-call">📞 Call Farmer Now</a>
            </div>
          </div>
          <div class="footer">
            Automated notification sent via Kisan Mitra Apps Script Engine.<br/>
            All rights reserved &bull; Government of India
          </div>
        </div>
      </body>
      </html>
    `;

    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      htmlBody: htmlBody,
    });

    Logger.log('✅ Email notification successfully delivered to: ' + recipientEmail);
    return true;
  } catch (err) {
    Logger.log('⚠️ Failed to send email alert: ' + err.toString());
    return false;
  }
}

/**
 * Handles incoming POST requests from the Kisan Mitra frontend or backend.
 */
function doPost(e) {
  try {
    let payload = {};

    // 1. Parse payload whether sent as JSON string, text, or urlencoded parameters
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = { message: e.postData.contents };
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const farmerName = String(payload.farmerName || '').trim();
    const mobile = String(payload.mobile || '').trim();
    const messageType = String(payload.messageType || 'Query').trim();
    const message = String(payload.message || '').trim();

    // 2. Access or auto-generate the Google Sheet
    const ss = getOrCreateSpreadsheet();
    const sheet = getOrCreateSheetTab(ss);
    const spreadsheetUrl = ss.getUrl();

    // 3. Append the record
    const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([
      timestamp,
      farmerName,
      mobile,
      messageType,
      message,
      'Pending Review', // Default status for workflow
      'Kisan Mitra Web App',
    ]);

    // 4. Send Gmail Notification
    const emailSent = sendEmailAlert({ farmerName, mobile, messageType, message }, spreadsheetUrl);

    // 5. Return success JSON
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Submission successfully recorded in Google Sheet and notified via Gmail.',
        spreadsheetUrl: spreadsheetUrl,
        spreadsheetId: ss.getId(),
        emailSent: emailSent,
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests — provides an interactive live dashboard
 * when visiting the Apps Script URL directly in any browser.
 */
function doGet(e) {
  try {
    const ss = getOrCreateSpreadsheet();
    const sheet = getOrCreateSheetTab(ss);
    const url = ss.getUrl();
    const totalRows = Math.max(0, sheet.getLastRow() - 1);

    let userEmail = 'ismparam786@gmail.com';
    try {
      userEmail = Session.getEffectiveUser().getEmail() || userEmail;
    } catch (err) { }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kisan Mitra Webhook API Status</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; background: #0b1f17; color: #e2e8f0; margin: 0; padding: 30px 16px; }
          .card { max-width: 640px; margin: 0 auto; background: #132a20; border: 1px solid #2d5a44; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .badge { display: inline-block; background: #166534; color: #86efac; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
          h1 { margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: 700; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
          .stat-box { background: #0c1a14; border: 1px solid #1f3d2e; padding: 16px; border-radius: 10px; }
          .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
          .stat-val { font-size: 16px; color: #ffffff; font-weight: 700; word-break: break-all; }
          .btn { display: block; text-align: center; background: #22c55e; color: #052e16; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-size: 15px; margin-top: 20px; transition: background 0.2s; }
          .btn:hover { background: #4ade80; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">● Webhook Live & Ready</span>
          <h1>🌾 Kisan Mitra Apps Script Engine</h1>
          <p>Your Google Apps Script webhook is successfully configured, connected with Gmail, and ready to record farmer support submissions.</p>
          
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-label">Total Submissions</div>
              <div class="stat-val" style="font-size: 28px; color: #4ade80;">${totalRows}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Gmail Alerts To</div>
              <div class="stat-val">${userEmail}</div>
            </div>
          </div>

          <div class="stat-box">
            <div class="stat-label">Target Google Sheet</div>
            <div class="stat-val" style="font-size: 13px; color: #93c5fd;">${url}</div>
          </div>

          <a href="${url}" class="btn" target="_blank">📊 Open Connected Google Sheet ↗</a>
        </div>
      </body>
      </html>
    `;

    return HtmlService.createHtmlOutput(html)
      .setTitle('Kisan Mitra Webhook API Status')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.toString());
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEST FUNCTION:
 * Run this directly in the Google Apps Script editor by selecting "testFullFlow"
 * and clicking "Run".
 * It will:
 *   1. Auto-create or open the Google Sheet.
 *   2. Append a sample farmer test submission.
 *   3. Send a test email to your Gmail.
 *   4. Output the exact Google Sheet URL in the execution log!
 * ─────────────────────────────────────────────────────────────────────────────
 */
function testFullFlow() {
  Logger.log('⏳ Running Kisan Mitra End-to-End Test...');

  const mockPayload = {
    farmerName: 'Ramesh Patel (Test)',
    mobile: '+919876543210',
    messageType: 'Grievance',
    message: 'Testing automatic sheet generation and Gmail integration from Kisan Mitra.',
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(mockPayload),
    },
  };

  const response = doPost(mockEvent);
  const resultJson = JSON.parse(response.getContent());

  Logger.log('───────────────────────────────────────────────────');
  Logger.log('🎉 RESULT: ' + (resultJson.success ? 'SUCCESS!' : 'FAILED'));
  Logger.log('📊 Google Sheet URL: ' + resultJson.spreadsheetUrl);
  Logger.log('📧 Email Sent: ' + (resultJson.emailSent ? 'YES' : 'NO'));
  Logger.log('───────────────────────────────────────────────────');
}

/**
 * Helper to display the URL of the connected Google Sheet.
 */
function getSpreadsheetUrl() {
  const ss = getOrCreateSpreadsheet();
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  return ss.getUrl();
}

/**
 * SunCircle — Waitlist backend (Google Apps Script)
 * =================================================================
 * This free, no-server backend does two things when someone joins
 * the waitlist on the website:
 *   1. Saves their email + time into a Google Sheet (your "Excel").
 *   2. Emails them a "thanks for joining SunCircle" confirmation.
 *
 * You'll also get the whole list in the Sheet, which you can export
 * to Excel/CSV any time (File → Download → Microsoft Excel / CSV).
 *
 * -----------------------------------------------------------------
 * ONE-TIME SETUP (about 5 minutes)
 * -----------------------------------------------------------------
 * 1. Go to https://sheets.google.com and create a new blank Sheet.
 *    Name it e.g. "SunCircle Waitlist".
 *
 * 2. In that Sheet, click  Extensions → Apps Script.
 *    Delete whatever code is there, paste THIS ENTIRE FILE, and
 *    click the save icon.
 *
 * 3. Click  Deploy → New deployment.
 *      - Click the gear ⚙ next to "Select type" → choose "Web app".
 *      - Description: "SunCircle waitlist"
 *      - Execute as:  Me (your Google account)
 *      - Who has access:  Anyone
 *      - Click Deploy.
 *    The first time, Google asks you to authorise it — allow it
 *    (it needs permission to write the sheet and send email from
 *    your Gmail). You may see an "unverified app" screen: click
 *    "Advanced" → "Go to … (unsafe)" — it's your own script.
 *
 * 4. Copy the "Web app" URL it gives you. It looks like:
 *      https://script.google.com/macros/s/AKfyc..../exec
 *
 * 5. Open  src/SunCircle.jsx  and paste that URL into:
 *      const WAITLIST_ENDPOINT = "PASTE_URL_HERE";
 *
 * That's it. Every waitlist signup now lands in your Sheet and the
 * person gets a confirmation email automatically.
 *
 * NOTE: If you ever change this script, you must redeploy:
 *   Deploy → Manage deployments → edit (pencil) → Version: New
 *   version → Deploy. (The /exec URL stays the same.)
 *
 * Gmail sends ~100 emails/day on free accounts, plenty for launch.
 * =================================================================
 */

var SHEET_NAME = "Waitlist";
// Paste the ID of your Google Sheet here. It is the long code in the Sheet URL:
// https://docs.google.com/spreadsheets/d/THIS_LONG_PART/edit
var SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";

function doPost(e) {
  try {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) { data = {}; }

    var email = (data.email || "").toString().trim();
    var source = (data.source || "").toString();

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Date", "Email", "Source"]);
    }

    // Basic validation
    var looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!looksLikeEmail) {
      return json({ result: "error", message: "invalid email" });
    }

    sheet.appendRow([new Date(), email, source]);

    sendConfirmation(email);

    return json({ result: "ok" });
  } catch (err) {
    return json({ result: "error", message: String(err) });
  }
}

function sendConfirmation(email) {
  var subject = "Thanks for joining the SunCircle waitlist";

  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#0e2a1d;line-height:1.6">' +
      '<h2 style="color:#16a34a;margin:0 0 12px">Thanks for joining SunCircle!</h2>' +
      '<p>You are now on the waitlist. We are building a way to buy cheaper, ' +
      'local solar energy from verified neighbours, and to help solar owners ' +
      'earn more from what they share.</p>' +
      '<p>We will email you the moment SunCircle opens in your area, along with ' +
      'early access as one of our first customers.</p>' +
      '<p>Sunny regards,<br><strong>The SunCircle team</strong></p>' +
      '<hr style="border:none;border-top:1px solid #e2efe7;margin:20px 0">' +
      '<p style="font-size:12px;color:#6b8577">SunCircle is pre-launch. ' +
      'You are receiving this because you joined our waitlist.</p>' +
    '</div>';

  var plain =
    "Thanks for joining SunCircle!\n\n" +
    "You are now on the waitlist. We will email you the moment SunCircle opens " +
    "in your area, along with early access as one of our first customers.\n\n" +
    "Sunny regards,\nThe SunCircle team";

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: html,
    body: plain,
    name: "SunCircle",
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lets you open the /exec URL in a browser to check it's deployed.
function doGet() {
  return json({ result: "ok", message: "SunCircle waitlist endpoint is live." });
}

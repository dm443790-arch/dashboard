/**
 * excelReportGenerator.js
 *
 * Automatically maintains reports/test-reports.xlsx using sessionStore data as the single source of truth.
 * 
 * Key Features:
 * - Creates one worksheet per execution date (YYYY-MM-DD).
 * - Appends or updates rows for multiple executions on the same date.
 * - Never deletes previous execution history or rows.
 * - Adds "View Image" hyperlinks pointing directly to the original screenshot file without embedding images.
 * - Safely handles file lock / open file conditions so execution is never disrupted.
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const store = require('./sessionStore');

const EXCEL_PATH = path.join(process.cwd(), 'reports', 'test-reports.xlsx');

function formatDateKey(dateInput) {
  if (!dateInput) return 'Unknown-Date';
  const dt = new Date(dateInput);
  if (isNaN(dt.getTime())) return 'Unknown-Date';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTestTitle(filename) {
  if (!filename) return '';
  let name = filename.replace(/\.(spec|test)\.(ts|js)$/i, '');
  name = name.replace(/[-_]/g, ' ');
  return name.split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}

async function updateExcelReportDisk() {
  try {
    const data = store.getAllData();
    let sessions = data.sessions || [];
    const executionsById = data.executionsById || {};
    const settings = data.settings || {};

    // Only show the latest session to avoid duplicate URLs from past runs
    if (sessions.length > 1) {
      sessions = [sessions[sessions.length - 1]];
    }

    const dir = path.dirname(EXCEL_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    let isNewFile = true;

    if (fs.existsSync(EXCEL_PATH)) {
      try {
        await workbook.xlsx.readFile(EXCEL_PATH);
        isNewFile = false;
      } catch (readErr) {
        console.warn('[excelReportGenerator] Existing Excel file unreadable or locked, initializing fresh workbook:', readErr.message);
      }
    }

    if (isNewFile) {
      workbook.creator = process.env.APP_TITLE || 'Playwright Test Automation';
      workbook.created = new Date();
    }

    // Group executions by date key (YYYY-MM-DD)
    const dateGroups = new Map();

    for (const session of sessions) {
      if (settings.excludeStoppedSessions && (session.status === 'STOPPED' || session.status === 'CANCELLED')) {
        continue;
      }

      const execIds = session.executionIds || [];

      for (const execId of execIds) {
        const exec = executionsById[execId];
        if (!exec) continue;

        if (settings.hideIncompleteTests && (exec.status === 'PENDING' || exec.status === 'RUNNING')) {
          continue;
        }

        const dateKey = formatDateKey(exec.startTime || exec.endTime || session.createdAt);
        if (!dateGroups.has(dateKey)) {
          dateGroups.set(dateKey, []);
        }
        dateGroups.get(dateKey).push({ session, exec });
      }
    }

    // If no session data exists and this is a new file, create today's worksheet with headers
    if (dateGroups.size === 0 && isNewFile) {
      const todayKey = formatDateKey(new Date());
      const ws = workbook.addWorksheet(todayKey);
      setupWorksheetHeaders(ws);
    }

    for (const [dateKey, items] of dateGroups.entries()) {
      let worksheet = workbook.getWorksheet(dateKey);
      if (!worksheet) {
        worksheet = workbook.addWorksheet(dateKey);
        setupWorksheetHeaders(worksheet);
      } else {
        // Ensure headers if worksheet was created blank
        if (worksheet.rowCount === 0) {
          setupWorksheetHeaders(worksheet);
        }
      }

      const lastSpecUrlHeader = worksheet.getRow(1).getCell(18);
      if (lastSpecUrlHeader.value !== 'Last URL (Spec)') {
        lastSpecUrlHeader.value = 'Last URL (Spec)';
      }
      const contactUsHeader = worksheet.getRow(1).getCell(9);
      if (contactUsHeader.value !== 'Contact Us (State / Result)') {
        contactUsHeader.value = 'Contact Us (State / Result)';
      }
      worksheet.getColumn(15).hidden = false;
      worksheet.getColumn(17).hidden = true;
      worksheet.getColumn(18).hidden = false;
      worksheet.getColumn(18).width = 45;

      // Exec ID remains in column 17; Last URL (Spec) is appended in column 18.
      const existingRowMap = new Map();
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Header row
        const execIdCell = row.getCell(17).value;
        if (execIdCell) {
          existingRowMap.set(String(execIdCell), rowNumber);
        }
      });

      for (const { session, exec } of items) {
        const attempts = exec.retries != null ? (exec.retries + 1) : 1;
        const durationStr = exec.duration != null ? `${exec.duration}s` : '—';
        const formattedTitle = formatTestTitle(exec.testScript) || exec.testScript;
        const envStr = `${exec.device || 'Desktop'} / ${exec.browser || 'Chromium'}`;
        const dateTimeStr = exec.startTime ? new Date(exec.startTime).toLocaleString() : new Date(session.createdAt).toLocaleString();
        const contactUsEnabled = typeof exec.contactUsEnabled === 'boolean'
          ? exec.contactUsEnabled
          : session.options?.contactUsEnabled;

        // Prepare Captured URL
        let paymentUrlObj = '—';
        if (exec.paymentUrl && exec.paymentUrl !== 'N/A') {
          if (/^https?:\/\//i.test(exec.paymentUrl)) {
            paymentUrlObj = { text: exec.paymentUrl, hyperlink: exec.paymentUrl, tooltip: exec.paymentUrl };
          } else {
            paymentUrlObj = exec.paymentUrl;
          }
        }

        // Prepare Screenshot hyperlink
        let screenshotObj = '—';
        if (exec.screenshotPath && exec.screenshotPath !== 'N/A') {
          let targetUrl = exec.screenshotPath;
          if (targetUrl.startsWith('/screenshots/')) {
            targetUrl = '.' + targetUrl; // relative path from reports/ directory
          } else if (targetUrl.startsWith('screenshots/')) {
            targetUrl = './' + targetUrl;
          }
          screenshotObj = { text: 'View Image', hyperlink: targetUrl, tooltip: 'View Full Resolution Screenshot' };
        }

        // Prepare Contact Us status
        let contactUsStr = contactUsEnabled === false
          ? 'DISABLED'
          : contactUsEnabled === true
            ? 'ENABLED · PENDING'
            : '—';
        const contactUsPrefix = contactUsEnabled === true ? 'ENABLED · ' : '';
        if (exec.contactUsStatus === 'PASS') {
          contactUsStr = `✓ ${contactUsPrefix}PASS`;
        } else if (exec.contactUsStatus === 'FAIL') {
          contactUsStr = `✗ ${contactUsPrefix}FAIL`;
        } else if (exec.contactUsStatus === 'CAPTCHA_BLOCKED') {
          contactUsStr = `🛡 ${contactUsPrefix}CAPTCHA`;
        } else if (exec.contactUsStatus === 'SKIPPED') {
          contactUsStr = '→ SKIPPED';
        } else if (exec.contactUsStatus === 'DISABLED') {
          contactUsStr = 'DISABLED';
        }
        if (exec.contactUsReason) {
          contactUsStr += `\nReason: ${exec.contactUsReason}`;
        }

        // Prepare Contact Us Screenshot hyperlink
        let contactUsScreenshotObj = '—';
        if (exec.contactUsScreenshot && exec.contactUsScreenshot !== 'N/A') {
          let targetUrl = exec.contactUsScreenshot;
          if (targetUrl.startsWith('/screenshots/')) {
            targetUrl = '.' + targetUrl;
          } else if (targetUrl.startsWith('screenshots/')) {
            targetUrl = './' + targetUrl;
          }
          contactUsScreenshotObj = { text: 'View Image', hyperlink: targetUrl, tooltip: 'View Contact Us Screenshot' };
        }

        // Prepare Visa Status URL
        let visaStatusUrlObj = '—';
        if (exec.visaStatusUrl && exec.visaStatusUrl !== 'N/A') {
          if (/^https?:\/\//i.test(exec.visaStatusUrl)) {
            visaStatusUrlObj = { text: exec.visaStatusUrl, hyperlink: exec.visaStatusUrl, tooltip: exec.visaStatusUrl };
          } else {
            visaStatusUrlObj = exec.visaStatusUrl;
          }
        }

        // Prepare Visa Status Screenshot hyperlink
        let visaStatusScreenshotObj = '—';
        if (exec.visaStatusScreenshot && exec.visaStatusScreenshot !== 'N/A') {
          let targetUrl = exec.visaStatusScreenshot;
          if (targetUrl.startsWith('/screenshots/')) {
            targetUrl = '.' + targetUrl;
          } else if (targetUrl.startsWith('screenshots/')) {
            targetUrl = './' + targetUrl;
          }
          visaStatusScreenshotObj = { text: 'View Image', hyperlink: targetUrl, tooltip: 'View Visa Status Screenshot' };
        }

        // Prepare Complete Partially URL
        let completePartiallyUrlObj = '—';
        if (exec.completePartiallyUrl && exec.completePartiallyUrl !== 'N/A') {
          if (/^https?:\/\//i.test(exec.completePartiallyUrl)) {
            completePartiallyUrlObj = { text: exec.completePartiallyUrl, hyperlink: exec.completePartiallyUrl, tooltip: exec.completePartiallyUrl };
          } else {
            completePartiallyUrlObj = exec.completePartiallyUrl;
          }
        }

        // Prepare Complete Partially Screenshot hyperlink
        let completePartiallyScreenshotObj = '—';
        if (exec.completePartiallyScreenshot && exec.completePartiallyScreenshot !== 'N/A') {
          let targetUrl = exec.completePartiallyScreenshot;
          if (targetUrl.startsWith('/screenshots/')) {
            targetUrl = '.' + targetUrl;
          } else if (targetUrl.startsWith('screenshots/')) {
            targetUrl = './' + targetUrl;
          }
          completePartiallyScreenshotObj = { text: 'View Image', hyperlink: targetUrl, tooltip: 'View Complete Partially Screenshot' };
        }

        let lastSpecUrlObj = '—';
        if (exec.lastSpecUrl && exec.lastSpecUrl !== 'N/A') {
          lastSpecUrlObj = { text: exec.lastSpecUrl, hyperlink: exec.lastSpecUrl, tooltip: exec.lastSpecUrl };
        }

        const rowValues = [
          `Run #${session.runNumber}`,
          dateTimeStr,
          `${formattedTitle} (${exec.testScript})`,
          envStr,
          exec.status || 'UNKNOWN',
          `Attempt #${attempts}`,
          paymentUrlObj,
          screenshotObj,
          contactUsStr,
          contactUsScreenshotObj,
          visaStatusUrlObj,
          visaStatusScreenshotObj,
          completePartiallyUrlObj,
          completePartiallyScreenshotObj,
          durationStr,
          exec.error || '—',
          exec.id,
          lastSpecUrlObj,
        ];

        let targetRowNumber = existingRowMap.get(String(exec.id));
        let row;

        if (targetRowNumber) {
          row = worksheet.getRow(targetRowNumber);
          row.values = rowValues;
        } else {
          row = worksheet.addRow(rowValues);
          existingRowMap.set(String(exec.id), row.number);
        }

        formatDataRow(row, exec.status);
        if (exec.contactUsReason) {
          const contactUsCell = row.getCell(9);
          contactUsCell.alignment = { ...contactUsCell.alignment, vertical: 'top', wrapText: true };
        }
      }
    }

    // Save workbook safely
    try {
      await workbook.xlsx.writeFile(EXCEL_PATH);
    } catch (writeErr) {
      console.warn('[excelReportGenerator] Unable to write reports/test-reports.xlsx (file may be open or locked):', writeErr.message);
    }

    return EXCEL_PATH;
  } catch (err) {
    console.error('[excelReportGenerator] Unexpected error generating Excel report:', err.message);
    return null;
  }
}

function setupWorksheetHeaders(worksheet) {
  worksheet.columns = [
    { header: 'Run #', key: 'runNumber', width: 12 },
    { header: 'Date & Time', key: 'dateTime', width: 22 },
    { header: 'Test Script', key: 'testScript', width: 34 },
    { header: 'Environment', key: 'environment', width: 24 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Attempts', key: 'attempts', width: 14 },
    { header: 'Captured URL', key: 'paymentUrl', width: 45 },
    { header: 'Screenshot', key: 'screenshot', width: 16 },
    { header: 'Contact Us (State / Result)', key: 'contactUs', width: 45 },
    { header: 'Contact Us Screenshot', key: 'contactUsScreenshot', width: 16 },
    { header: 'Visa Status URL', key: 'visaStatusUrl', width: 45 },
    { header: 'Visa Status Screenshot', key: 'visaStatusScreenshot', width: 16 },
    { header: 'Complete Partially URL', key: 'completePartiallyUrl', width: 45 },
    { header: 'Complete Partially Screenshot', key: 'completePartiallyScreenshot', width: 16 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Error Details', key: 'error', width: 45 },
    { header: 'Exec ID', key: 'execId', width: 36 },
    { header: 'Last URL (Spec)', key: 'lastSpecUrl', width: 45 },
  ];

  // Hide the internal execution ID column.
  worksheet.getColumn(17).hidden = true;

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate dark header
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF334155' } },
    };
  });
}

function formatDataRow(row, status) {
  row.height = 22;

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = cell.font || { name: 'Arial', size: 9.5 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: (colNumber === 1 || colNumber === 5 || colNumber === 6 || (colNumber === 7 && cell.value === '—') || colNumber === 8 || colNumber === 9) ? 'center' : 'left',
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    // Style Status column (Col 5)
    if (colNumber === 5) {
      cell.font = { name: 'Arial', size: 9.5, bold: true };
      if (status === 'PASS' || status === 'RETRY_PASS') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        cell.font.color = { argb: 'FF15803D' };
      } else if (status === 'FAIL') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font.color = { argb: 'FFDC2626' };
      } else if (status === 'RUNNING') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        cell.font.color = { argb: 'FF1D4ED8' };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.font.color = { argb: 'FF475569' };
      }
    }

    // Style Hyperlinks (Col 7 Payment URL, Col 8 Screenshot)
    if ((colNumber === 7 || colNumber === 8) && typeof cell.value === 'object' && cell.value !== null && cell.value.hyperlink) {
      cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF0284C7' }, underline: true };
    }
  });
}

module.exports = {
  updateExcelReportDisk,
  EXCEL_PATH,
};

/**
 * baseTest.ts
 *
 * Extended Playwright test fixture.
 * Provides:
 *   - Automatic screenshot capture on test end (pass or fail)
 *   - Payment URL capture (page.url() on pass)
 *   - Result JSON written to .temp-results/ for report generation
 *   - Captcha helper re-exported for convenience
 *
 * Each Playwright worker is a separate process, so module-level
 * variables are isolated per worker — no concurrency issues.
 */

import {
  test as base,
  expect,
  Page,
  TestInfo,
} from '@playwright/test';
import { waitForCaptcha } from './captcha/captchaHelper';
import { solveRecaptchaAudio, RecaptchaAudioOptions } from './captcha/recaptchaAudio';
import { waitForPageLoad, WaitForPageLoadOptions } from './pageLoad';
import { captureScreenshot, getCapturedScreenshots, clearCapturedScreenshots } from './screenshot';
import { submitContactUsForm } from './contactUs';
import path from 'path';
import fs from 'fs';

export { captureScreenshot, captureScreenshot as capturescreenshot };

// ─── Result data structure ───

export interface TestResultData {
  testScript: string;
  testName: string;
  device: string;
  deviceType: string;
  browser: string;
  viewport: string;
  status: 'PASS' | 'FAIL' | 'RETRY_PASS';
  retries: number;
  duration: number;
  paymentUrl: string;
  screenshotPath: string;
  lastSpecUrl: string;
  contactUsEnabled: boolean;
  contactUsStatus: string;
  contactUsScreenshot: string;
  contactUsReason: string;
  visaStatusUrl: string;
  visaStatusScreenshot: string;
  completePartiallyUrl: string;
  completePartiallyScreenshot: string;
  error: string;
  failedStep: string;
  startTime: string;
  endTime: string;
}

// ─── Fixture types ───

function getFallbackTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

export function getUploadFile(): string {
  const uploadCandidates = [
    path.resolve(process.cwd(), 'tests', 'assets', '10kb.jpg'),
    path.resolve(process.cwd(), 'debug-chromium-desktop.png'),
  ];
  return uploadCandidates.find(c => fs.existsSync(c)) || uploadCandidates[0];
}

type MyFixtures = {
  page: Page;
  /** Re-exported captcha helper for convenient import */
  waitForCaptcha: typeof waitForCaptcha;
  /** Solves the Google reCAPTCHA audio challenge (detect → audio → transcribe → verify) */
  solveRecaptchaAudio: (options?: RecaptchaAudioOptions) => Promise<boolean>;
  /** Wait until the page is fully loaded (robust; never throws). */
  waitForPageLoad: (options?: WaitForPageLoadOptions) => Promise<void>;
  getUploadFile: typeof getUploadFile;
};

// ─── Extend test ───

export const test = base.extend<MyFixtures>({
  page: async ({ page }, use) => {
    // Configurable timeouts passed from Dashboard execution session
    const envActionTimeout = process.env.PLAYWRIGHT_ACTION_TIMEOUT ? parseInt(process.env.PLAYWRIGHT_ACTION_TIMEOUT, 10) : NaN;
    const envNavTimeout = process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT ? parseInt(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT, 10) : NaN;

    const actionTimeout = (!isNaN(envActionTimeout) && envActionTimeout > 0) ? envActionTimeout : 15_000;
    const navTimeout = (!isNaN(envNavTimeout) && envNavTimeout > 0) ? envNavTimeout : 30_000;

    page.setDefaultTimeout(actionTimeout); // Configurable wait for all actions (click, fill, select, locator waits)
    page.setDefaultNavigationTimeout(navTimeout); // Configurable wait for page navigations and redirects

    // Preserve navigation history so afterEach can report the last URL reached,
    // even if Playwright closes the page after a failure.
    const navigationHistory: string[] = [];
    const recordUrl = () => {
      try {
        const url = page.url();
        if (url && url !== 'about:blank' && navigationHistory[navigationHistory.length - 1] !== url) {
          navigationHistory.push(url);
        }
      } catch {}
    };
    recordUrl();
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) recordUrl();
    });
    (page as Page & { __specNavigationHistory?: string[] }).__specNavigationHistory = navigationHistory;

    await use(page);
  },
  waitForCaptcha: async ({}, use) => {
    await use(waitForCaptcha);
  },
  solveRecaptchaAudio: async ({ page }, use) => {
    await use((options) => solveRecaptchaAudio(page, options));
  },
  waitForPageLoad: async ({ page }, use) => {
    await use((options) => waitForPageLoad(page, options));
  },
  getUploadFile: async ({}, use) => {
    await use(getUploadFile);
  },
});

// Re-export expect for convenience
export { expect };

// ─── AfterEach: Capture results ───

test.afterEach(async ({ page }, testInfo: TestInfo) => {
  // Extract device and browser from project name
  // Project name format: "Desktop-Chrome", "iPhone 14-Safari", etc.
  const projectName = testInfo.project.name || 'Unknown-Unknown';
  const lastHyphen = projectName.lastIndexOf('-');
  const device = lastHyphen > 0 ? projectName.substring(0, lastHyphen) : projectName;
  const browser = lastHyphen > 0 ? projectName.substring(lastHyphen + 1) : 'Unknown';

  const scriptName = path.basename(testInfo.file || 'unknown.spec.ts');
  const testName = testInfo.title;
  const savedVisaStatusUrl = process.env.VISA_STATUS_PAGE_URL;
  const savedVisaStatusScreenshot = process.env.VISA_STATUS_SCREENSHOT;
  const savedPaymentUrl = process.env.PAYMENT_PAGE_URL;
  const savedCompletePartiallyUrl = process.env.COMPLETE_PARTIALLY_URL;
  delete process.env.PAYMENT_PAGE_URL;
  delete process.env.VISA_STATUS_PAGE_URL;
  delete process.env.VISA_STATUS_SCREENSHOT;
  delete process.env.COMPLETE_PARTIALLY_URL;
  const isPassed = testInfo.status === 'passed';
  const isRetried = testInfo.retry > 0;

  // Determine final status
  let status: TestResultData['status'];
  if (isPassed && isRetried) {
    status = 'RETRY_PASS';
  } else if (isPassed) {
    status = 'PASS';
  } else {
    status = 'FAIL';
  }

  // Format duration
  const durationMs = testInfo.duration;
  const durationSec = (durationMs / 1000).toFixed(1);

  // Timestamps
  const startTime = new Date(
    Date.now() - durationMs
  ).toISOString().replace('T', ' ').substring(0, 19);
  const endTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Get viewport info
  let viewportStr = 'N/A';
  try {
    if (page && !page.isClosed()) {
      const vp = page.viewportSize();
      if (vp) viewportStr = `${vp.width} x ${vp.height}`;
    }
  } catch {}

  // Capture payment URL (if test passed, current page URL is payment page) and capture page screenshot
  let paymentUrl = 'N/A';
  let capturedUrlScreenshot: string | null = null;
  let failureScreenshotPath: string | null = null;
  let visaStatusUrl = 'N/A';
  let visaStatusScreenshot = 'N/A';
  let completePartiallyUrl = savedCompletePartiallyUrl || 'N/A';
  let completePartiallyScreenshot = 'N/A';

  const sessionTimestamp = process.env.SESSION_TIMESTAMP || getFallbackTimestamp();
  const testKey = scriptName.replace(/\.(spec|test)\.(ts|js)$/, '');

  if (isPassed) {
    try {
      if (page && !page.isClosed()) {
        // If the spec explicitly saved the payment URL (e.g., before navigating to visa-status), use it
        const savedPaymentUrl = process.env.PAYMENT_PAGE_URL;
        paymentUrl = savedPaymentUrl || page.url();

        // Use the status screenshot saved before the test navigates away.
        if (savedVisaStatusUrl) {
          visaStatusUrl = savedVisaStatusUrl;
          if (savedVisaStatusScreenshot) {
            visaStatusScreenshot = savedVisaStatusScreenshot.startsWith('/')
              ? savedVisaStatusScreenshot
              : `/${savedVisaStatusScreenshot}`;
          }
        }

        // If the spec set a complete-partially URL, capture it as the complete-partially section
        if (savedCompletePartiallyUrl) {
          completePartiallyUrl = savedCompletePartiallyUrl;

          // Capture screenshot of the current page (which is the complete-partially result page)
          try {
            const cleanName = `${testKey}-${device}-${browser}-complete-partially.png`
              .toLowerCase()
              .replace(/[^a-z0-9\-_.]/g, '-');

            const relativeDir = path.join('screenshots', sessionTimestamp, testKey);
            const fullDir = path.join(process.cwd(), relativeDir);
            fs.mkdirSync(fullDir, { recursive: true });

            const fullPath = path.join(fullDir, cleanName);
            const relativePath = `/screenshots/${sessionTimestamp}/${testKey}/${cleanName}`.replace(/\\/g, '/');

            const reportsDir = path.join(process.cwd(), 'reports', 'screenshots', sessionTimestamp, testKey);
            fs.mkdirSync(reportsDir, { recursive: true });
            const reportsFullPath = path.join(reportsDir, cleanName);

            await page.screenshot({
              path: fullPath,
              fullPage: true,
              timeout: 5000,
            });

            if (fs.existsSync(fullPath)) {
              fs.copyFileSync(fullPath, reportsFullPath);
            }

            completePartiallyScreenshot = relativePath;
          } catch (screenshotErr: any) {
            console.warn(
              `[baseTest] Failed to capture complete-partially screenshot for ${scriptName}:`,
              screenshotErr?.message || screenshotErr
            );
          }
        }

        // Automatically capture screenshot of the payment page (if no visa-status page was visited)
        if (!savedVisaStatusUrl) {
          try {
            const cleanName = `${testKey}-${device}-${browser}-captured-url.png`
              .toLowerCase()
              .replace(/[^a-z0-9\-_.]/g, '-');

            const relativeDir = path.join('screenshots', sessionTimestamp, testKey);
            const fullDir = path.join(process.cwd(), relativeDir);
            fs.mkdirSync(fullDir, { recursive: true });

            const fullPath = path.join(fullDir, cleanName);
            const relativePath = `/screenshots/${sessionTimestamp}/${testKey}/${cleanName}`.replace(/\\/g, '/');

            // Also mirror to reports/screenshots/ for standalone report viewing
            const reportsDir = path.join(process.cwd(), 'reports', 'screenshots', sessionTimestamp, testKey);
            fs.mkdirSync(reportsDir, { recursive: true });
            const reportsFullPath = path.join(reportsDir, cleanName);

            await page.screenshot({
              path: fullPath,
              fullPage: true,
              timeout: 5000,
            });

            if (fs.existsSync(fullPath)) {
              fs.copyFileSync(fullPath, reportsFullPath);
            }

            capturedUrlScreenshot = relativePath;
          } catch (screenshotErr: any) {
            console.warn(
              `[baseTest] Failed to capture screenshot of URL page for ${scriptName}:`,
              screenshotErr?.message || screenshotErr
            );
          }
        }
      }
    } catch {}
  } else {
    // ─── GUARANTEED FAILURE SCREENSHOT CAPTURE (Locator errors, timeouts, network, assertions, etc.) ───
    try {
      const cleanFailureName = `${testKey}-${device}-${browser}-failed.png`
        .toLowerCase()
        .replace(/[^a-z0-9\-_.]/g, '-');

      const relativeDir = path.join('screenshots', sessionTimestamp, testKey);
      const fullDir = path.join(process.cwd(), relativeDir);
      fs.mkdirSync(fullDir, { recursive: true });

      const fullPath = path.join(fullDir, cleanFailureName);
      const relativePath = `/screenshots/${sessionTimestamp}/${testKey}/${cleanFailureName}`.replace(/\\/g, '/');

      const reportsDir = path.join(process.cwd(), 'reports', 'screenshots', sessionTimestamp, testKey);
      fs.mkdirSync(reportsDir, { recursive: true });
      const reportsFullPath = path.join(reportsDir, cleanFailureName);

      let saved = false;

      // 1. If page is open, capture immediately (using fullPage: false as primary to avoid hanging on broken DOM/scroll, with safe timeout)
      if (page && !page.isClosed()) {
        try {
          await page.screenshot({
            path: fullPath,
            fullPage: false,
            timeout: 4000,
          });
          saved = fs.existsSync(fullPath);
        } catch (pageErr: any) {
          console.warn(`[baseTest] Direct failure screenshot attempt error for ${scriptName}:`, pageErr?.message || pageErr);
        }
      }

      // 2. Check Playwright's native attachment (from screenshot: 'only-on-failure')
      if (!saved && testInfo.attachments && testInfo.attachments.length > 0) {
        const screenshotAtt = testInfo.attachments.find(
          (att) =>
            (att.name === 'screenshot' || att.contentType?.startsWith('image/')) &&
            att.path &&
            fs.existsSync(att.path)
        );
        if (screenshotAtt?.path) {
          try {
            fs.copyFileSync(screenshotAtt.path, fullPath);
            saved = true;
          } catch (_) {}
        }
      }

      if (saved && fs.existsSync(fullPath)) {
        try {
          fs.copyFileSync(fullPath, reportsFullPath);
        } catch (_) {}
        failureScreenshotPath = relativePath;
      }
    } catch (failErr: any) {
      console.warn(`[baseTest] Failed to capture failure screenshot for ${scriptName}:`, failErr?.message || failErr);
    }
  }

  // Prefer an explicitly saved payment URL. Otherwise use the last URL reached
  // by the spec, even if the current page has since moved or closed.
  let lastSpecUrl = '';
  try {
    if (savedPaymentUrl && savedPaymentUrl !== 'about:blank') {
      lastSpecUrl = savedPaymentUrl;
    } else if (page && !page.isClosed()) {
      const url = page.url();
      if (url && url !== 'about:blank') {
        lastSpecUrl = url;
      }
    }
  } catch {
    // Page may be mid-closure or in an error state; ignore.
  }
  if (!lastSpecUrl) {
    const history = (page as Page & { __specNavigationHistory?: string[] })?.__specNavigationHistory;
    lastSpecUrl = history?.[history.length - 1] || '';
  }

  // Attempt after every execution, independently of the visa flow result.
  const contactUsEnabled = process.env.CONTACT_US_ENABLED === 'true';
  let contactUsStatus = contactUsEnabled ? 'PENDING' : 'DISABLED';
  let contactUsScreenshot = 'N/A';
  let contactUsReason = '';
  if (contactUsEnabled) {
    test.setTimeout(Math.max(testInfo.timeout, testInfo.duration) + 60_000);
    try {
      if (page && !page.isClosed()) {
        const contactResult = await submitContactUsForm(page, testKey);
        contactUsStatus = contactResult.status;
        contactUsScreenshot = contactResult.screenshotPath || 'N/A';
        contactUsReason = contactResult.reason || '';
      } else {
        contactUsStatus = 'FAIL';
        contactUsReason = 'The Playwright page was closed before Contact Us could run.';
      }
    } catch (contactErr: any) {
      contactUsStatus = 'FAIL';
      contactUsReason = contactErr?.message || 'Contact Us submission failed.';
      console.warn(`[baseTest] Contact Us step error for ${scriptName}:`, contactErr?.message || contactErr);
    }
  }

  // Evaluate captured screenshots
  let finalScreenshotPath = 'N/A';
  const isScreenshotEnabled = process.env.ENABLE_SCREENSHOT_CAPTURE === 'true';

  if (failureScreenshotPath) {
    finalScreenshotPath = failureScreenshotPath;
  } else if (capturedUrlScreenshot) {
    finalScreenshotPath = capturedUrlScreenshot;
  } else if (isScreenshotEnabled) {
    const captured = getCapturedScreenshots();
    if (captured && captured.length > 0) {
      finalScreenshotPath = captured[captured.length - 1];
      if (!finalScreenshotPath.startsWith('/')) {
        finalScreenshotPath = '/' + finalScreenshotPath;
      }
    }
  }
  clearCapturedScreenshots();

  // Extract error info
  let errorMessage = '';
  let failedStep = '';
  if (!isPassed && testInfo.error) {
    errorMessage = testInfo.error.message || '';
    // Try to extract a meaningful step name from error
    const stepMatch = errorMessage.match(/waiting for.*?["'](.+?)["']/i);
    if (stepMatch) {
      failedStep = stepMatch[1];
    } else {
      failedStep = 'Unknown';
    }
    if (lastSpecUrl) {
      errorMessage += `\n[Last spec URL: ${lastSpecUrl}]`;
    }
    // Truncate very long errors
    if (errorMessage.length > 500) {
      errorMessage = errorMessage.substring(0, 500) + '... (truncated)';
    }
  }

  // Build result object
  const result: TestResultData = {
    testScript: scriptName,
    testName: testName,
    device: device,
    deviceType: (device === 'Desktop') ? 'Desktop' : 'Mobile',
    browser: browser,
    viewport: viewportStr,
    status: status,
    retries: testInfo.retry,
    duration: parseFloat(durationSec),
    paymentUrl: paymentUrl,
    screenshotPath: finalScreenshotPath,
    lastSpecUrl: lastSpecUrl,
    contactUsEnabled: contactUsEnabled,
    contactUsStatus: contactUsStatus,
    contactUsScreenshot: contactUsScreenshot,
    contactUsReason: contactUsReason,
    visaStatusUrl: visaStatusUrl,
    visaStatusScreenshot: visaStatusScreenshot,
    completePartiallyUrl: completePartiallyUrl,
    completePartiallyScreenshot: completePartiallyScreenshot,
    error: errorMessage,
    failedStep: failedStep,
    startTime: startTime,
    endTime: endTime,
  };

  // Write result JSON to .temp-results/
  // Filename is deterministic — same test+device+browser overwrites on retry
  // So only the FINAL attempt's result survives
  const resultDir = path.join(process.cwd(), '.temp-results');
  fs.mkdirSync(resultDir, { recursive: true });

  const resultFileName = `${testKey}__${device}__${browser}.json`;
  const resultFilePath = path.join(resultDir, resultFileName);

  try {
    fs.writeFileSync(resultFilePath, JSON.stringify(result, null, 2), 'utf8');
  } catch (writeError) {
    console.error(
      `[baseTest] Failed to write result JSON for ${testKey}:`,
      writeError
    );
  }
});

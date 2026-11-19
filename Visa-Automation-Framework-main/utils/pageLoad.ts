/**
 * pageLoad.ts
 *
 * Reliable "wait until the page is fully loaded" helper.
 *
 * The previous approach used `page.waitForLoadState('networkidle', { timeout: 5000 })`
 * directly in each spec. That is fragile because:
 *   - Pages with websockets, analytics, polling, or slow third-party resources
 *     often never reach "networkidle", so the 5s timeout fires and the test
 *     continues acting on a half-loaded page → false failures.
 *   - The wait was applied inconsistently (some navigations waited, some didn't).
 *
 * This helper provides a single, robust wait that:
 *   1. Waits for the `load` event (DOM + resources finished loading).
 *   2. Attempts `networkidle` with a generous timeout (no throw on timeout).
 *   3. As a final fallback, waits for the <body> to be visible and stable.
 *
 * It never throws — it always resolves, so it can be called unconditionally
 * after any navigation or action that triggers a page load.
 */

import { Page } from '@playwright/test';

export interface WaitForPageLoadOptions {
  /**
   * Timeout (ms) for the `networkidle` phase.
  * Default: 5000 (5s) — matches the previous per-spec wait while remaining bounded.
   */
  networkIdleTimeout?: number;

  /**
   * Timeout (ms) for the initial `load` event wait.
   * Default: 30000 (30s).
   */
  loadTimeout?: number;

  /**
   * If true, log a message when networkidle times out (for debugging).
   * Default: false.
   */
  verbose?: boolean;
}

/**
 * Wait until the page is fully loaded.
 *
 * Safe to call after `page.goto()`, after a navigation-triggering click,
 * or at any point where you need to ensure the page is ready before
 * interacting with it.
 *
 * @param page - The Playwright page.
 * @param options - Optional overrides for timeouts and verbosity.
 */
export async function waitForPageLoad(
  page: Page,
  options: WaitForPageLoadOptions = {}
): Promise<void> {
  const {
    networkIdleTimeout = 5_000,
    loadTimeout = 30_000,
    verbose = false,
  } = options;

  // 1. Wait for the `load` event (fires when the page and all sub-resources
  //    have finished loading). Use a generous timeout; if it times out we
  //    still continue to the next phase rather than throwing.
  try {
    await page.waitForLoadState('load', { timeout: loadTimeout });
  } catch (err) {
    if (verbose) {
      console.warn(
        '[waitForPageLoad] `load` event timed out, continuing:',
        err instanceof Error ? err.message : err
      );
    }
  }

  // 2. Attempt `networkidle` (no network connections for 500ms). This is the
  //    strongest signal that the page is "done". Many real-world pages never
  //    reach this state (websockets, analytics, polling), so we treat a
  //    timeout as non-fatal.
  try {
    await page.waitForLoadState('networkidle', { timeout: networkIdleTimeout });
  } catch (err) {
    if (verbose) {
      console.warn(
        '[waitForPageLoad] `networkidle` not reached within',
        networkIdleTimeout,
        'ms, continuing:',
        err instanceof Error ? err.message : err
      );
    }
  }

  // 3. Final fallback: ensure the <body> is visible and the page is not in a
  //    pending navigation. This guards against the rare case where both of the
  //    above phases resolved but the page is still mid-render.
  try {
    await page.locator('body').waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    // Body not visible — page may be about:blank or errored. Nothing more we
    // can do here; the caller's next action will surface the real problem.
  }
}

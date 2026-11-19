/**
 * Turkey Visa Application - E2E Test
 *
 * Refactored to use shared baseTest, captcha helper, and exact date methods.
 * Starts directly from the application page URL.
 * Restricted to Chrome and Firefox only (Safari is not supported).
 */

import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDateOfBirth,
    getPassportIssueDate,
    getPassportExpiryDate,
} from '../../utils/date';
import fs from 'fs';
import path from 'path';

test('Turkey Visa Application', async ({ page, browserName, waitForCaptcha }) => {

    // ── Restrict browsers ──

    if (browserName === 'webkit') {
        throw new Error('Safari (WebKit) is not supported for this test');
    }

    if (browserName !== 'chromium' && browserName !== 'firefox') {
        test.skip(true, `Skipping unsupported browser: ${browserName}`);
    }


    // ── Captcha listener before nav ──

    const captchaPromise = waitForCaptcha(page);


    // ── Open application page directly ──

    await page.goto('https://turkey-evisa.it.com/application/');

    // Cloudflare serves a "Performing security verification" interstitial to
    // headless browsers. Wait for it to clear (or for the real form to appear)
    // before proceeding.
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    // If Cloudflare's bot-check page is showing, wait for the real form to load.
    const cloudflareChallenge = page.getByText('Performing security verification');
    if (await cloudflareChallenge.isVisible().catch(() => false)) {
        console.log('Cloudflare challenge detected, waiting for it to clear...');
        await cloudflareChallenge.waitFor({ state: 'detached', timeout: 30000 });
    }

    // Wait for the actual application form to be present.
    await page.getByRole('textbox', { name: 'Name' })
        .waitFor({ state: 'visible', timeout: 30000 });


    // ── General details ──

    await page.getByRole('textbox', { name: 'Name' })
        .fill('testing');

    await page.getByRole('textbox', { name: 'Email ID *' })
        .fill('dm443790@gmail.com');

    await page.getByRole('combobox', { name: 'Selected country' })
        .click();
    await page.getByRole('combobox', { name: 'Search' })
        .fill('ind');
    await page.getByRole('option', { name: 'India +' })
        .click();

    await page.getByRole('textbox', { name: 'Phone *' })
        .fill('78945 61239');

    await page.getByLabel('Nationality *')
        .selectOption('89');


    // ── Date fields (Using exact date methods) ──

    const arrival = getArrivalDate();
    await page.getByLabel('Arrival Year')
        .selectOption(arrival.year);
    await page.getByLabel('Arrival Month')
        .selectOption(arrival.month);
    await page.getByLabel('Date of Arrival in Turkey *')
        .selectOption(arrival.day);


    // ── Fill captcha ──

    const captchaText = await captchaPromise;
    console.log('Decoded CAPTCHA:', captchaText);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captchaText);


    // ── Register ──

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Register' })
        .click();

    await page.getByRole('textbox', { name: 'Given/First Name as per' })
        .waitFor();


    // ── Applicant details ──

    await page.getByRole('textbox', { name: 'Given/First Name as per' })
        .fill('testing');

    // Passport Expiry Date (Auto-calculated: 5 years ahead)
    const passExp = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);
    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    // Passport Issue Date (Auto-calculated: 6 months ago)
    const passIssue = getPassportIssueDate();
    await page.locator('#yr_pass_issue_0')
        .selectOption(passIssue.year);
    await page.locator('#mon_pass_issue_0')
        .selectOption(passIssue.month);
    await page.locator('#day_pass_issue_0')
        .selectOption(passIssue.day);

    await page.getByRole('textbox', { name: 'Surname as per Passport' })
        .fill('testing');

    // Date of Birth (Auto-calculated: 25 years old)
    const dob = getDateOfBirth();
    await page.locator('#yr_dob_0')
        .selectOption(dob.year);
    await page.locator('#mon_dob_0')
        .selectOption(dob.month);
    await page.locator('#day_dob_0')
        .selectOption(dob.day);

    await page.locator('#pass_no_0')
        .fill('111');
    await page.locator('#city_of_birth_0')
        .fill('testing');
    await page.locator('#father_name_0')
        .fill('testing');
    await page.locator('#mother_name_0')
        .fill('testing');

    await page.locator('#type_of_support_doc_0')
        .selectOption('Visa');

    await page.locator('#support_doc_country_0')
        .selectOption('145');

    await page.getByRole('checkbox', { name: 'Unlimited' })
        .check();

    // Date picker UI interaction for support doc issue date
    await page.locator('#sup_issue_date_0')
        .click();
    await page.getByRole('link', { name: '10' })
        .click();

    await page.locator('#support_doc_no_0')
        .fill('testing');

await page.waitForTimeout(2000);
await page.getByRole('button', { name: 'Submit & Preview' }).click();

await page.waitForTimeout(2000);
await page.getByRole('button', { name: 'Confirm & Submit' }).click();
    // ── Resolve upload file path ──

    const uploadCandidates = [
        path.resolve(__dirname, '..', '..', 'debug-chromium-desktop.png'),
        path.resolve(process.cwd(), 'debug-chromium-desktop.png'),
        path.resolve(process.cwd(), 'tests', 'assets', '10kb.jpg'),
    ];

    const uploadFilePath = uploadCandidates.find(
        candidate => fs.existsSync(candidate)
    );

    if (!uploadFilePath) {
        throw new Error(
            `No upload file found. Checked: ${uploadCandidates.join(', ')}`
        );
    }


    // ── Upload Support Document ──

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(uploadFilePath);
    } else {
        await page.getByRole('button', { name: 'Choose File' })
            .setInputFiles(uploadFilePath);
    }


    // ── Submit & Preview ──

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();


    // ── Confirm & Submit ──

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Confirm & Submit' })
        .click();


    // ── Final assertions ──

    await expect(
        page.getByRole('heading', { name: 'Pay Application Processing Fee' })
    ).toBeVisible({ timeout: 30000 });

    await expect(
        page.getByText('dm443790@gmail.com')
    ).toBeVisible();


    // ── Payment URL auto-captured by baseTest afterEach ──

    console.log(
        `\n================ PAYMENT PAGE URL ================\n` +
        `${page.url()}\n` +
        `====================================================\n`
    );




    // =====================================
    // EXTRACT TEMPORARY ORDER ID
    // =====================================

    const orderId = await page.locator('#app_of').textContent();
    const trimmedOrderId = orderId?.trim() || '';
    console.log(`\n================ TEMPORARY ORDER ID ================\n${trimmedOrderId}\n====================================================\n`);

    expect(trimmedOrderId).toBeTruthy();


    // =====================================
    // VISA STATUS PAGE — PASTE ORDER ID
    // =====================================
 await page.waitForTimeout(3000);
    // New captcha listener for the visa-status page (new page load = new captcha)
    const statusCaptchaPromise = waitForCaptcha(page);

    await page.goto('https://turkey-evisa.it.com/visa-status/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'application_id_status' }).click();
    await page.getByRole('textbox', { name: 'application_id_status' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'passport_no_status' }).click();
    await page.getByRole('textbox', { name: 'passport_no_status' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(statusCaptcha);

    await page.getByRole('button', { name: 'Check Status' }).click();
    await expect(page.getByText('dm443790@gmail.com')).toBeVisible();

    // Save visa-status page URL for the report
    process.env.VISA_STATUS_PAGE_URL = page.url();
    process.env.VISA_STATUS_SCREENSHOT = await capturescreenshot(page, 'visa-status') || '';
    console.log(`\n================ VISA STATUS PAGE URL ================\n${page.url()}\n====================================================\n`);


    // =====================================
    // COMPLETE PARTIALLY FILLED
    // =====================================
 await page.waitForTimeout(3000);
    // New captcha listener for the complete-partially page
    const partialCaptchaPromise = waitForCaptcha(page);

    await page.goto('https://turkey-evisa.it.com/complete-partially/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'temporary_application_id' }).click();
    await page.getByRole('textbox', { name: 'temporary_application_id' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'captcha_code' })
        .fill(partialCaptcha);

    await page.getByRole('button', { name: 'Complete Partially Filled' }).click();

    // Wait for navigation to the final URL (payment page or application page)
    await page.waitForURL(/(visa-payment|apply\/\?a=edit)/, { timeout: 30000 });
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    // Save the final URL for the report
    process.env.COMPLETE_PARTIALLY_URL = page.url();
    console.log(`\n================ COMPLETE PARTIALLY URL ================\n${page.url()}\n====================================================\n`);
});
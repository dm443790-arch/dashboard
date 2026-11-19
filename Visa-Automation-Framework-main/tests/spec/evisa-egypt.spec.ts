/**
 * Egypt Visa Application - E2E Test
 *
 * Refactored to use shared baseTest, captcha helper, and exact date methods.
 * Starts directly from the application page URL.
 */

import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getPassportExpiryDate,
} from '../../utils/date';
import fs from 'fs';
import path from 'path';

test('Egypt Visa Application', async ({ page, waitForCaptcha }) => {

    // ── Captcha listener before nav ──

    const captchaPromise = waitForCaptcha(page);


    // ── Open application page directly ──

    await page.goto('https://eta-egypt.info/application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

await page.waitForTimeout(3000);
    // ── General details ──

    await page.getByRole('textbox', { name: 'Name *' })
        .fill('Abhijeet');

      await page.getByRole('textbox', { name: 'Email Address *' }).fill('dm443790@gmail.com');

     await page.getByRole('combobox', { name: 'Selected country' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('indi');
  await page.getByLabel('List of countries').getByText('India', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Phone Number *' }).fill('1234 567 890');

   await page.getByLabel('Nationality').selectOption('51');


    // ── Date fields (Using exact date methods) ──

    const arrival = getArrivalDate();
    await page.getByLabel('Arrival Year')
        .selectOption(arrival.year);
    await page.getByLabel('Arrival Month')
        .selectOption(arrival.month);
    await page.getByLabel('Arrival Day')
        .selectOption(arrival.day);


    // ── Fill captcha ──

    const captchaText = await captchaPromise;
    console.log('Decoded CAPTCHA:', captchaText);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captchaText);


    // ── Register ──

    await page.waitForTimeout(3000);
    await capturescreenshot(page, 'registration-page');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Register' })
        .click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).waitFor();


    // ── Passport details ──

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).fill('Abhi');

    await page.getByRole('textbox', { name: 'Surname as per Passport' })
        .fill('kumar');
  await page.locator('#day_dob_0').selectOption('10');
  await page.locator('#mon_dob_0').selectOption('07');
    await page.locator('#yr_dob_0').selectOption('2018');

    // Passport Expiry Date (Auto-calculated: 5 years ahead)
    const passExp = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);
    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    await page.locator('#pass_no_0')
        .fill('111');

    await page.locator('#occupation_0')
        .selectOption('MISSIONARY');


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


    // ── Upload file ──

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(uploadFilePath);
    } else {
        await page.getByRole('button', { name: 'Choose File' })
            .setInputFiles(uploadFilePath);
    }


    // ── Submit & Preview ──

    await page.waitForTimeout(3000);
    await capturescreenshot(page, 'applicant-detail');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // ── Confirm & Submit ──

    await page.waitForTimeout(3000);
    await capturescreenshot(page, 'preview');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Confirm & Submit' })
        .click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // ── Final assertions ──

    await expect(
        page.getByRole('heading', { name: 'Pay Application Processing Fee' })
    ).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(3000);
    await capturescreenshot(page, 'payment-page');

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

    await page.goto('https://eta-egypt.info/application-status/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Order Id*' }).click();
    await page.getByRole('textbox', { name: 'Order Id*' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Passport No*' }).click();
    await page.getByRole('textbox', { name: 'Passport No*' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'Enter CAPTCHA' })
        .fill(statusCaptcha);

    await page.getByRole('button', { name: 'Track Application' }).click();
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

    await page.goto('https://eta-egypt.info/complete-application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Temporary Order ID*' }).click();
    await page.getByRole('textbox', { name: 'Temporary Order ID*' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter CAPTCHA' })
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
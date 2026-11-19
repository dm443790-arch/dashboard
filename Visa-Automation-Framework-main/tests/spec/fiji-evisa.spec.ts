/**
 * Fiji Visa Application - E2E Test
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

test('Fiji Visa Application', async ({ page, waitForCaptcha }) => {

    // ── Captcha listener before nav ──

    const captchaPromise = waitForCaptcha(page);


    // ── Open application page directly ──

    await page.goto('https://fiji-evisa.com/apply-now/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // ── General details ──

    await page.getByRole('textbox', { name: 'name' })
        .fill('Abhijeet');

    await page.getByRole('textbox', { name: 'email' })
        .fill('dm443790@gmail.com');

    await page.getByRole('combobox', { name: 'Selected country' })
        .click();
    await page.getByRole('combobox', { name: 'Search' })
        .fill('ind');
    await page.getByRole('option', { name: 'India +' })
        .click();

    await page.getByRole('textbox', { name: 'phone' })
        .fill('78945 61239');

    await page.locator('#nationality_gen')
        .selectOption('53');


    // ── Date fields (Using exact date methods) ──

    const arrival = getArrivalDate();
    await page.getByLabel('Year')
        .selectOption(arrival.year);
    await page.getByLabel('Mon')
        .selectOption(arrival.month);
    await page.getByLabel('Day', { exact: true })
        .selectOption(arrival.day);


    // ── Fill captcha ──

    const captchaText = await captchaPromise;
    console.log('Decoded CAPTCHA:', captchaText);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captchaText);


    // ── Register ──

    await page.waitForTimeout(1000);
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

    await page.locator('#pass_no_0')
        .fill('111');

    // Passport Expiry Date (Auto-calculated: 5 years ahead)
    const passExp = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);
    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    await page.getByRole('textbox', { name: 'Surname as per Passport' })
        .fill('na');

    await page.locator('#occupation_0')
        .selectOption('JOURNALIST');

    await page.locator('#emp_address_0')
        .fill('na');
    await page.locator('#employer_name_0')
        .fill('na');
    await page.locator('#emp_phone_0')
        .fill('na');

    await page.locator('#address_0')
        .fill('na');

    await page.locator('#purpose_of_visit_0')
        .selectOption('Transit');

    await page.locator('#depart_country_0')
        .selectOption('45');

    await page.locator('#host_address_0')
        .fill('a');


    // ── Submit & Preview ──

    await page.waitForTimeout(1000);
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

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'preview');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Confirm & Submit' })
        .click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // ── Wait for dynamic upload page to load ──

    await expect(page.locator('[id^="passport_form_"]'))
        .toBeVisible({ timeout: 15000 });


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


    // ── Upload files with validation ──

    const uploadSections = [
        'passport_form_',
        'photo_form_',
        'flight_itinerary_form_'
    ];

    for (const section of uploadSections) {
        const sectionLocator = page.locator(`[id^="${section}"]`);

        await sectionLocator
            .locator('input[type="file"]')
            .setInputFiles(uploadFilePath);

        await expect(sectionLocator)
            .toContainText('✓ Uploaded', { timeout: 15000 });

        console.log(`Uploaded: ${section.replace(/_/g, ' ')}`);
    }


    // ── Save & Continue ──

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'doc-page');
    await page.getByRole('button', { name: 'Save & Continue' })
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

    await page.waitForTimeout(1000);
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

    await page.goto('https://fiji-evisa.com/check-application-status/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Enter Order Id' }).click();
    await page.getByRole('textbox', { name: 'Enter Order Id' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Enter Passport No' }).click();
    await page.getByRole('textbox', { name: 'Enter Passport No' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'Enter code' })
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

    await page.goto('https://fiji-evisa.com/complete-partially/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Enter Order Id' }).click();
    await page.getByRole('textbox', { name: 'Enter Order Id' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter code' })
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
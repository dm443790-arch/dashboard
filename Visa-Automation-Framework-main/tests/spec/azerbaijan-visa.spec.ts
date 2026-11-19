/**
 * Azerbaijan Visa Application - E2E Test
 *
 * Refactored to use shared baseTest and captcha helper.
 */

import { test, expect, capturescreenshot } from '../../utils/baseTest';
import { getArrivalDate, getPassportExpiryDate } from '../../utils/date';
import path from 'path';

test('Azerbaijan Visa Application', async ({ page, waitForCaptcha, getUploadFile }) => {

    // =====================================
    // SET UP CAPTCHA LISTENER BEFORE NAV
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // NAVIGATE (triggers captcha API call)
    // =====================================

    await page.goto('https://azerbaijan-visa.info/apply/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // =====================================
    // GENERAL DETAILS
    // (Fill while captcha loads in background)
    // =====================================

    await page.getByRole('textbox', { name: 'name' })
        .fill('testing');

    await page.getByRole('textbox', { name: 'email' })
        .fill('dm443790@gmail.com');

    await page.getByRole('combobox', { name: 'Selected country' })
        .locator('div')
        .nth(1)
        .click();

    await page.getByRole('combobox', { name: 'Search' })
        .fill('ind');

    await page.getByRole('option', { name: 'India +' })
        .click();

    await page.getByRole('textbox', { name: 'phone' })
        .fill('9876543210');

    const arrival = getArrivalDate();

    await page.getByLabel('Year')
        .selectOption(arrival.year);

    await page.getByLabel('Mon')
        .selectOption(arrival.month);

    await page.locator('#nationality_gen')
        .selectOption('61');


    // =====================================
    // CAPTCHA
    // =====================================

    const captcha = await captchaPromise;

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captcha);


    // =====================================
    // REGISTER
    // =====================================

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

    // Wait for passport form
    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).waitFor();


    // =====================================
    // PASSPORT
    // =====================================

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).fill('testing');

    await page.getByRole('textbox', {
        name: 'Surname as per Passport'
    }).fill('testing');

    const expiry = getPassportExpiryDate();

    await page.locator('#yr_pass_exp_0')
        .selectOption(expiry.year);

    await page.locator('#mon_pass_exp_0')
        .selectOption(expiry.month);

    await page.locator('#pass_no_0')
        .fill('111');

    await page.locator('#travel_document_0')
        .selectOption('Diplomatic passport');

    await page.locator('#occupation_0')
        .selectOption('MILITARY');

    await page.locator('#not_above_house_no_0')
        .fill('testing');


    // =====================================
    // UPLOAD FILE
    // =====================================

    const uploadFile = getUploadFile();

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(uploadFile);
    } else {
        await page.getByRole('button', {
            name: 'Choose File'
        }).setInputFiles(uploadFile);
    }

    // Wait for upload success
    const fileName = path.basename(uploadFile);
    await expect(fileInput.first()).toHaveValue(new RegExp(fileName.replace('.', '\\.')));


    // =====================================
    // PREVIEW
    // =====================================

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'applicant-detail');
    await page.waitForTimeout(2000);
    await page.getByRole('button', {
        name: 'Submit & Preview'
    }).click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await expect(
        page.locator('#order_id_spn')
    ).toBeVisible();


    // =====================================
    // PAYMENT
    // =====================================

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'preview');
    await page.waitForTimeout(2000);
    await page.getByRole('button', {
        name: 'Confirm & Submit'
    }).click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await expect(
        page.getByRole('heading', {
            name: 'Pay Visa Processing Fee'
        })
    ).toBeVisible();

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'payment-page');

    await expect(
        page.getByText('dm443790@gmail.com')
    ).toBeVisible();

    await expect(
        page.getByRole('heading', {
            name: 'Application Detail'
        })
    ).toBeVisible();


    // =====================================
    // SAVE PAYMENT PAGE URL (before navigating away)
    // =====================================

    process.env.PAYMENT_PAGE_URL = page.url();
    console.log(`\n================ PAYMENT PAGE URL ================\n${page.url()}\n====================================================\n`);


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

    await page.goto('https://azerbaijan-visa.info/visa-status/');
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

    await page.goto('https://azerbaijan-visa.info/complete-partially/');
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
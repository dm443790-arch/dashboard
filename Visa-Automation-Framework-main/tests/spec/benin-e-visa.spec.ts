/**
 * Benin Visa Application - E2E Test
 *
 * Refactored to use shared baseTest and captcha helper.
 */

import { test, expect, getUploadFile, capturescreenshot } from '../../utils/baseTest';
import path from 'path';
import { getArrivalDate, getPassportExpiryDate } from '../../utils/date';

test('Benin Visa Application', async ({ page, waitForCaptcha, waitForPageLoad }) => {

    // =====================================
    // SET UP CAPTCHA LISTENER BEFORE NAV
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // NAVIGATE
    // =====================================

    await page.goto('https://benin-e-visa.com/application/');
    await waitForPageLoad();



    // =====================================
    // GENERAL DETAILS
    // =====================================

    await page.getByRole('textbox', { name: 'name' })
        .fill('testing');

    await page.getByRole('textbox', { name: 'email' })
        .fill('dm443790@gmail.com');

    await page.getByRole('combobox', { name: 'Selected country' })
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
    await page.getByLabel('Day', { exact: true })
        .selectOption(arrival.day);

    await page.locator('#nationality_gen')
        .selectOption('41');


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
    await waitForPageLoad();

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

    await page.getByRole('textbox', { name: 'Surname as per Passport' })
        .fill('testing');

    const expiry = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(expiry.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(expiry.month);

    await page.locator('#pass_no_0')
        .fill('111');

    await page.locator('#occupation_0')
        .selectOption('JOURNALIST');

    await page.locator('#address_0')
        .fill('testing');

    await page.locator('#appli_country_0')
        .selectOption('44');
    await page.locator('#depart_country_0')
        .selectOption('45');
    await page.locator('#purpose_of_visit_0')
        .selectOption('SUMMER CAMP');

    await page.locator('#return_ticket_0')
        .fill('testing');
    await page.locator('#accomodation_address_0')
        .fill('testing');
    await page.locator('#maintenance_means_0')
        .fill('testing');
    await page.locator('#destination_0')
        .fill('testing');


    // =====================================
    // UPLOAD FILE
    // =====================================

    const uploadFile = getUploadFile();
    const fileName = path.basename(uploadFile);

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(uploadFile);
    } else {
        await page.getByRole('button', { name: 'Choose File' })
            .setInputFiles(uploadFile);
    }

    await expect(fileInput.first()).toHaveValue(new RegExp(fileName.replace('.', '\\.')));


    // =====================================
    // PREVIEW
    // =====================================

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'applicant-detail');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();
    await waitForPageLoad();

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'preview');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();
    await waitForPageLoad();


    // =====================================
    // PAYMENT
    // =====================================

    await expect(
        page.getByRole('heading', {
            name: 'Pay Application Processing Fee'
        })
    ).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'payment-page');

    await expect(
        page.getByText('dm443790@gmail.com')
    ).toBeVisible();

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

    await page.goto('https://benin-e-visa.com/application-status/');
    await waitForPageLoad();

    await page.getByRole('textbox', { name: 'EX-123456789' }).click();
    await page.getByRole('textbox', { name: 'EX-123456789' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'EX-2345678' }).click();
    await page.getByRole('textbox', { name: 'EX-2345678' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'CAPTCHA *' })
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

    await page.goto('https://benin-e-visa.com/complete-application/');
    await waitForPageLoad();

    await page.getByRole('textbox', { name: 'EX-' }).click();
    await page.getByRole('textbox', { name: 'EX-' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter code' })
        .fill(partialCaptcha);

    await page.getByRole('button', { name: 'Continue Application' }).click();

    // Wait for navigation to the final URL (payment page or application page)
    await page.waitForURL(/(visa-payment|apply\/\?a=edit)/, { timeout: 30000 });
    await waitForPageLoad();

    // Save the final URL for the report
    process.env.COMPLETE_PARTIALLY_URL = page.url();
    console.log(`\n================ COMPLETE PARTIALLY URL ================\n${page.url()}\n====================================================\n`);
});
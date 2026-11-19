/**
 * Brazil Visa Application - E2E Test
 *
 * Refactored to use shared baseTest and captcha helper.
 */

import { test, expect, getUploadFile, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDepartureDate,
    getDateOfBirth,
    getPassportIssueDate,
    getPassportExpiryDate
} from '../../utils/date';

test('Brazil Visa Application', async ({ page, waitForCaptcha, waitForPageLoad }) => {
    test.setTimeout(120_000);

    // =====================================
    // SET UP CAPTCHA LISTENER BEFORE NAV
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // NAVIGATE
    // =====================================

    await page.goto('https://brazil-evisa.info/apply-evisa/');
    await waitForPageLoad();



    // =====================================
    // GENERAL DETAILS
    // =====================================

    await page.getByRole('textbox', { name: 'name' })
        .fill('testing');

    await page.getByRole('textbox', { name: 'email' })
        .fill('dm443790@gmail.com');

    await page.getByRole('textbox', { name: 'phone' })
        .fill('9876543210');

    await page.locator('#nationality_gen')
        .selectOption('28');

    const arrival = getArrivalDate();
    await page.locator('#yr_arrival')
        .selectOption(arrival.year);
    await page.locator('#mon_arrival')
        .selectOption(arrival.month);

    const departure = getDepartureDate(15, 3);
    await page.locator('#yr_departure')
        .selectOption(departure.year);
    await page.locator('#mon_departure')
        .selectOption(departure.month);


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

    await page.locator('#pass_no_0')
        .fill('111');

    await page.locator('#city_of_birth_0')
        .fill('testing');

    const expiry = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(expiry.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(expiry.month);

    const dob = getDateOfBirth();
    await page.locator('#yr_dob_0')
        .selectOption(dob.year);
    await page.locator('#mon_dob_0')
        .selectOption(dob.month);

    const issue = getPassportIssueDate();
    await page.locator('#yr_pass_issue_0')
        .selectOption(issue.year);
    await page.locator('#mon_pass_issue_0')
        .selectOption(issue.month);

    await page.locator('#occupation_0')
        .selectOption('LAWYER');

    await page.locator('#city_0')
        .fill('testing');
    await page.locator('#not_above_house_no_0')
        .fill('testing');
    await page.locator('#address_0')
        .fill('testing');
    await page.locator('#postal_code_0')
        .fill('testing');
    await page.locator('#not_above_city_0')
        .fill('testing');
    await page.locator('#not_above_state_0')
        .fill('testing');

    await page.getByRole('textbox', { name: 'Air/Land/Sea' })
        .fill('testing');

    await page.locator('#father_name_0')
        .fill('testing');

    await page.locator('div')
        .filter({ hasText: /^Mother Name \* Edit$/ })
        .locator('div')
        .first()
        .click();
    await page.locator('#mother_name_0')
        .fill('testing');

    await page.locator('#accomodation_0')
        .click();
    await page.locator('#accomodation_0')
        .fill('testing');


    // =====================================
    // PREVIEW
    // =====================================

    await page.getByRole('button', { name: 'Next' })
        .click();

    await page.locator('#accomodation_address_0')
        .fill('testing');

        await page.getByRole('textbox', { name: 'DD-MM-YYYY' }).fill('10-12-2010');
        await page.locator('#accommodation_nationality_0').selectOption('41');
        await page.locator('#ref_name_in_0').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator('#ref_name_in_0').click();
        await page.locator('#ref_name_in_0').fill('testing');
        await page.locator('#ref_add_in_0').click();
        await page.locator('#ref_add_in_0').fill('testing');
        await page.locator('#ref_name_cn_0').click();
        await page.locator('#ref_name_cn_0').fill('testing');
        await page.locator('#ref_relationsip_in_0').click();
        await page.locator('#ref_relationsip_in_0').fill('testing');
        await page.locator('#your_contry_address_0').click();
        await page.locator('#your_contry_address_0').fill('testing');
        await page.locator('#ref_phone_in_0').click();
        await page.locator('#ref_phone_in_0').fill('testing');


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

    await expect(page.locator('[id^="passport_form_"]'))
        .toBeVisible({ timeout: 15000 });


    // =====================================
    // UPLOAD FILE
    // =====================================

    const uploadFile = getUploadFile();

    await page.locator('[id^="passport_form_"] input[type="file"]')
        .setInputFiles(uploadFile);
    await expect(page.getByText('Document has been uploaded!'))
        .toBeVisible();
    console.log('Passport document uploaded');

    await page.locator('[id^="photo_form_"] input[type="file"]')
        .setInputFiles(uploadFile);
    await expect(page.getByText('Document has been uploaded!'))
        .toBeVisible();
    console.log('Photo uploaded');

    await waitForPageLoad();


    // =====================================
    // PAYMENT
    // =====================================

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'doc-page');
    await page.getByRole('button', { name: 'Save & Continue' })
        .click();
    await waitForPageLoad();

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

    await page.goto('https://brazil-evisa.info/track-application/');
    await waitForPageLoad();

    await page.getByRole('textbox', { name: 'Order Id *' }).click();
    await page.getByRole('textbox', { name: 'Order Id *' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Passport No *' }).click();
    await page.getByRole('textbox', { name: 'Passport No *' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'Security Code *' })
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

    await page.goto('https://brazil-evisa.info/complete-partially/');
    await waitForPageLoad();

    await page.getByRole('textbox', { name: 'Temporary Order ID *' }).click();
    await page.getByRole('textbox', { name: 'Temporary Order ID *' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Security Code *' })
        .fill(partialCaptcha);

    await page.getByRole('button', { name: 'Complete Partially Filled' }).click();

    // Wait for navigation to the final URL (payment page or application page)
    await page.waitForURL(/(visa-payment|apply\/\?a=edit)/, { timeout: 30000 });
    await waitForPageLoad();

    // Save the final URL for the report
    process.env.COMPLETE_PARTIALLY_URL = page.url();
    console.log(`\n================ COMPLETE PARTIALLY URL ================\n${page.url()}\n====================================================\n`);
});
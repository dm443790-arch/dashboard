import { test, expect, getUploadFile, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDateOfBirth,
    getPassportExpiryDate
} from '../../utils/date';

test('Cameroon Visa Application', async ({ page, waitForCaptcha }) => {

    // =====================================
    // SET UP CAPTCHA LISTENER BEFORE NAV
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // NAVIGATE
    // =====================================

    await page.goto('https://visit-cameroon.info/application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // =====================================
    // GENERAL DETAILS
    // =====================================

    await page.locator('#name')
        .fill('testing');

    await page.locator('#email_id')
        .fill('dm443790@gmail.com');

    await page.getByRole('textbox', { name: 'Your Working Contact/WhatsApp' })
        .click();
    await page.getByRole('combobox', { name: 'Selected country' })
        .click();
    await page.getByRole('combobox', { name: 'Search' })
        .fill('india');
    await page.getByRole('option', { name: 'India +' })
        .click();
    await page.getByRole('textbox', { name: 'Your Working Contact/WhatsApp' })
        .click();
    await page.getByRole('textbox', { name: 'Your Working Contact/WhatsApp' })
        .fill('9876543210');

    const arrival = getArrivalDate();
    await page.locator('#yr_arrival')
        .selectOption(arrival.year);
    await page.locator('#mon_arrival')
        .selectOption(arrival.month);
    await page.locator('#day_arrival')
        .selectOption(arrival.day);

    await page.locator('#nationality_gen')
        .selectOption('42');

    await page.locator('#chk')
        .click();


    // =====================================
    // CAPTCHA
    // =====================================

    const captcha = await captchaPromise;
    await page.locator('#chk')
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

    const dob = getDateOfBirth();
    await page.locator('#yr_dob_0')
        .selectOption(dob.year);
    await page.locator('#mon_dob_0')
        .selectOption(dob.month);

    const expiry = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(expiry.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(expiry.month);

    await page.locator('#pass_no_0')
        .fill('111');

    await page.locator('#occupation_0')
        .selectOption('CHARITY-SOCIAL WORKER');

    await page.locator('#not_above_house_no_0')
        .fill('testing');

    await page.locator('#purpose_of_visit_0')
        .selectOption('Mission');


    // =====================================
    // PREVIEW
    // =====================================

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


    // =====================================
    // UPLOAD FILE
    // =====================================

    const uploadFile = getUploadFile();

    const uploadSections = [
        'passport_form_',
        'round_ticket_form_',
        'vaccine_certificate_form_',
        'hotel_booking_form_',
        'funds_form_',
        'business_invitation_form_'
    ];

    for (const section of uploadSections) {
        await page.locator(`[id^="${section}"] input[type="file"]`)
            .setInputFiles(uploadFile);
        await expect(page.locator(`[id^="${section}"]`))
            .toContainText('✓ Uploaded');
    }


    // =====================================
    // PAYMENT
    // =====================================

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'doc-page');
    await page.getByRole('button', { name: 'Save & Continue' })
        .click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await expect(
        page.getByRole('heading', { name: 'Pay Application Processing Fee' })
    ).toBeVisible();

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'payment-page');

    await expect(
        page.getByText('dm443790@gmail.com')
    ).toBeVisible();

      console.log(
        `\n================ PAYMENT PAGE URL ================\n${page.url()}\n====================================================\n`
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

    await page.goto('https://visit-cameroon.info/application-status/');
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

    await page.getByRole('textbox', { name: 'captcha_code_status' })
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

    await page.goto('https://visit-cameroon.info/complete-ongoing/');
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

    await page.getByRole('button', { name: 'Complete Partially' }).click();

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
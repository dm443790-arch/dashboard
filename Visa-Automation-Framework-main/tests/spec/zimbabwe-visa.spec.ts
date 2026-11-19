import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getPassportExpiryDate,
} from '../../utils/date';

test('Zimbabwe Visa Application', async ({ page, waitForCaptcha, getUploadFile }) => {

    // =====================================
    // 1. CAPTCHA LISTENER
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // 2. NAVIGATION
    // =====================================

    await page.goto('https://zimbabwe-visa.com/application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (e) {
        console.log('Network never went idle, continuing anyway');
    }


    // =====================================
    // 3. GENERAL DETAILS
    // =====================================

    await page.locator('#name')
        .fill('Abhijeet');

    await page.locator('#email_id')
        .fill('dm443790@gmail.com'); // Fixed typo from .como

    await page.getByRole('combobox', { name: 'Selected country' })
        .click();
    await page.getByRole('combobox', { name: 'Search' })
        .fill('ind');
    await page.getByRole('option', { name: 'India +' })
        .click();

    await page.getByRole('textbox', { name: 'Your Working Contact/WhatsApp' })
        .fill('98765 43214');


    // =====================================
    // 4. DATES
    // =====================================

    const arrival = getArrivalDate();
    await page.locator('#yr_arrival')
        .selectOption(arrival.year);
    await page.locator('#mon_arrival')
        .selectOption(arrival.month);
    await page.locator('#day_arrival')
        .selectOption(arrival.day);

    await page.locator('#nationality_gen')
        .selectOption('143');


    // =====================================
    // 5. CAPTCHA
    // =====================================

    const captcha = await captchaPromise;
    console.log('Decoded CAPTCHA:', captcha);
    await page.locator('#chk')
        .fill(captcha);


    // =====================================
    // 6. REGISTER
    // =====================================

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Register' })
        .click();

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).waitFor();


    // =====================================
    // 7. APPLICANT DETAILS
    // =====================================

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).fill('Abhi');

    await page.locator('#pass_no_0')
        .fill('111');

    const passExp = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);
    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    await page.getByRole('textbox', { name: 'Surname as per Passport' })
        .fill('na');
    await page.locator('#address_0')
        .fill('na');
    await page.locator('#occupation_0')
        .selectOption('MEDIA');
    await page.locator('#marital_status_0')
        .selectOption('Married');
    await page.locator('#host_fullname_0')
        .fill('na');
    await page.locator('#host_address_0')
        .fill('na');
    await page.locator('#emergency_givenname_0')
        .fill('na');
    await page.locator('#emergency_surname_0')
        .fill('na');
    await page.locator('#emergency_phone_0')
        .fill('na');
    await page.locator('#emergency_email_0')
        .fill('dm443790@gmail.com');


    // =====================================
    // 8. SUBMIT & PREVIEW
    // =====================================

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();


    // =====================================
    // 9. UPLOAD FILES
    // =====================================

    await expect(page.locator('[id^="passport_form_"]'))
        .toBeVisible({ timeout: 15000 });

    const uploadFile = getUploadFile();

    const uploadSections = [
        'passport',
        'photo',
        'hotel_booking',
        'host_id',
        'referring_letter'
    ];

    for (const section of uploadSections) {
        await page.locator(`[id^="${section}_form_"] input[type="file"]`)
            .setInputFiles(uploadFile);
        await expect(page.locator(`[id^="${section}_delete_"] path`).nth(1))
            .toBeVisible({ timeout: 30000 });
    }


    // =====================================
    // 10. SAVE & CONTINUE
    // =====================================

    await page.getByRole('button', { name: 'Save & Continue' })
        .click();


    // =====================================
    // 11. FINAL ASSERTIONS
    // =====================================

    await expect(
        page.getByRole('heading', { name: 'Application Detail' })
    ).toBeVisible({ timeout: 30000 });

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

    await page.goto('https://zimbabwe-visa.com/application-status/');
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

    await page.goto('https://zimbabwe-visa.com/complete-partially/');
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
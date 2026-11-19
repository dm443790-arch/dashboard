import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDepartureDate,
    getPassportExpiryDate
} from '../../utils/date';

test('Rwanda Visa Application', async ({ page, waitForCaptcha, getUploadFile }) => {

    // =====================================
    // SET UP CAPTCHA LISTENER BEFORE NAV
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // NAVIGATE
    // =====================================

    await page.goto('https://evisa-rwanda.com/apply-now/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


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
        .fill('india');
    await page.getByRole('option', { name: 'India +' })
        .click();

    await page.getByRole('textbox', { name: 'phone' })
        .fill('9876543210');

    const arrival = getArrivalDate();
    await page.locator('#yr_arrival')
        .selectOption(arrival.year);
    await page.locator('#mon_arrival')
        .selectOption(arrival.month);
    await page.locator('#day_arrival')
        .selectOption(arrival.day);

    const departure = getDepartureDate();
    await page.locator('#yr_departure')
        .selectOption(departure.year);
    await page.locator('#mon_departure')
        .selectOption(departure.month);
    await page.locator('#day_departure')
        .selectOption(departure.day);

    await page.locator('#nationality_gen')
        .selectOption('52');


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

    const expiry = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(expiry.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(expiry.month);
    await page.locator('#day_pass_exp_0')
        .selectOption(expiry.day);

    await page.getByRole('textbox', { name: 'Surname as per Passport' })
        .fill('testing');

    await page.locator('#address_0')
        .fill('testing');

    await page.locator('#marital_status_0')
        .selectOption('Married');

    await page.locator('#sp_name_0')
        .fill('testing');

    await page.locator('#sp_nationality_0')
        .selectOption('45');

    await page.locator('#occupation_0')
        .selectOption('MEDIA');

    await page.locator('#father_name_0')
        .fill('testing');

    await page.locator('#mother_name_0')
        .fill('testing');

    await page.locator('#accomodation_0')
        .fill('testing');

    await page.locator('#accomodation_address_0')
        .fill('testing');

    await page.locator('#accommodation_state_0')
        .fill('testing');

    await page.locator('#accommodation_city_0')
        .fill('testing');


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

    // Rwanda requires the passport bio page, applicant photo, and application
    // letter. Upload every file input on this document form so none are left
    // empty when Save & Continue is pressed.
    const documentInputs = page.locator('input[type="file"]');
    const documentInputCount = await documentInputs.count();
    for (let i = 0; i < documentInputCount; i++) {
        await documentInputs.nth(i).setInputFiles(uploadFile);
        await expect(page.getByText('Document has been uploaded!', { exact: true }))
            .toHaveCount(i + 1, { timeout: 15000 });
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
        page.getByRole('heading', { name: 'Pay eVisa Processing Fee' })
    ).toBeVisible();

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'payment-page');

    await page.getByText('dm443790@gmail.com')
        .click();




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

    await page.goto('https://evisa-rwanda.com/track-application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'e.g. RW0000000ABC' }).click();
    await page.getByRole('textbox', { name: 'e.g. RW0000000ABC' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Enter Passport No.' }).click();
    await page.getByRole('textbox', { name: 'Enter Passport No.' }).fill('111');

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

    await page.goto('https://evisa-rwanda.com/complete-partially/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'e.g. RW0000000ABC' }).click();
    await page.getByRole('textbox', { name: 'e.g. RW0000000ABC' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter code' })
        .fill(partialCaptcha);

    await page.getByRole('button', { name: 'Continue Application' }).click();

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

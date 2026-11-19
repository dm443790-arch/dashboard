import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getPassportExpiryDate,
} from '../../utils/date';
import { waitForUploadApi } from '../../utils/apiUpload';

test('Ivory Coast Visa Application', async ({ page, waitForCaptcha, getUploadFile }) => {

    // =====================================
    // 1. CAPTCHA LISTENER
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // 2. NAVIGATION
    // =====================================

    await page.goto('https://ivory-coast-evisa.info/registration/');

    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // =====================================
    // 3. GENERAL DETAILS
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

    await page.locator('#nationality_gen')
        .selectOption('56');


    // =====================================
    // 4. DATES
    // =====================================

    const arrival = getArrivalDate();

    await page.getByLabel('Year')
        .selectOption(arrival.year);

    await page.getByLabel('Mon')
        .selectOption(arrival.month);

    try {
        await page.getByLabel('Day', { exact: true })
            .selectOption(arrival.day);
    } catch {
        console.log('No Day dropdown for arrival found');
    }


    // =====================================
    // 5. CAPTCHA
    // =====================================

    const captcha = await captchaPromise;

    console.log('Decoded CAPTCHA:', captcha);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captcha);


    // =====================================
    // 6. REGISTER & PASSPORT DETAILS
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

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).fill('testing');

    await page.locator('#pass_no_0')
        .fill('111');

    const passExp = getPassportExpiryDate();

    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);

    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);

    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    await page.locator('#address_0')
        .fill('testing');

    await page.locator('#occupation_0')
        .selectOption('LAWYER');

    await page.locator('#accomodation_address_0')
        .fill('testing');


    // =====================================
    // 7. SUBMIT & PREVIEW
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


    // =====================================
    // 8. UPLOAD FILES - API VERIFICATION
    // =====================================

    await expect(
        page.locator('[id^="passport_form_"]')
    ).toBeVisible({ timeout: 15000 });

    const uploadFile = getUploadFile();

    const uploadSections = [
        {
            name: 'Passport',
            formId: 'passport_form_'
        },
        {
            name: 'Travel Itinerary',
            formId: 'travel_itinerary_form_'
        },
        {
            name: 'Hotel Booking',
            formId: 'hotel_booking_form_'
        }
    ];

    for (const section of uploadSections) {

        const sectionLocator = page.locator(
            `[id^="${section.formId}"]`
        ).first();

        // Make sure this upload section exists
        await expect(sectionLocator)
            .toBeVisible({ timeout: 15000 });

        // -------------------------------------
        // STEP 1: Start API listener FIRST
        // -------------------------------------

        const uploadApiPromise = waitForUploadApi(
            page,
            ['upload_temp'],
            20000
        );

        // -------------------------------------
        // STEP 2: Select the file
        // -------------------------------------

        await sectionLocator
            .locator('input[type="file"]')
            .setInputFiles(uploadFile);

        // -------------------------------------
        // STEP 3: Wait for API SUCCESS
        // -------------------------------------

        await uploadApiPromise;

        // -------------------------------------
        // STEP 4: Upload confirmed
        // -------------------------------------

        console.log(
            `[VERIFIED] ${section.name} uploaded successfully.`
        );

        // Give the website UI a moment to update
        await page.waitForTimeout(1000);
    }


    // =====================================
    // 9. FINALIZE
    // =====================================

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'doc-page');
    await page.getByRole('button', {
        name: 'Save & Continue'
    }).click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }


    // =====================================
    // 10. FINAL ASSERTIONS
    // =====================================

    await expect(
        page.getByRole('heading', {
            name: 'Application Detail'
        })
    ).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'payment-page');

    await expect(
        page.getByText('dm443790@gmail.com')
    ).toBeVisible();


    // =====================================
    // PAYMENT / CONFIRMATION URL
    // =====================================

    console.log(
        `\n================ PAYMENT/CONFIRM PAGE URL ================\n` +
        `${page.url()}\n` +
        `===========================================================\n`
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

    await page.goto('https://ivory-coast-evisa.info/track-application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Order ID *' }).click();
    await page.getByRole('textbox', { name: 'Order ID *' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Passport No *' }).click();
    await page.getByRole('textbox', { name: 'Passport No *' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'Enter text from image *' })
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

    await page.goto('https://ivory-coast-evisa.info/complete-partially/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Temporary Order ID *' }).click();
    await page.getByRole('textbox', { name: 'Temporary Order ID *' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter text from image *' })
        .fill(partialCaptcha);

    await page.getByRole('button', { name: 'Resume Application' }).click();

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
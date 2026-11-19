/**
 * Jordan Visa Application - E2E Test
 *
 * Uses:
 * - shared baseTest
 * - shared captcha helper
 * - shared date utilities
 * - API-based upload confirmation
 */

import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDepartureDate,
    getDateOfBirth,
    getPassportIssueDate,
    getPassportExpiryDate,
} from '../../utils/date';
import { waitForUploadApi } from '../../utils/apiUpload';

test('Jordan Visa Application', async ({ page, waitForCaptcha, getUploadFile }) => {

    // =====================================
    // 1. CAPTCHA LISTENER
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // 2. OPEN APPLICATION
    // =====================================

    await page.goto('https://jordan-evisa.info/apply/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    try {
        await page.waitForLoadState('networkidle', {
            timeout: 5000
        });
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
        .fill('97864 53129');


    // =====================================
    // 4. ARRIVAL DATE
    // =====================================

    const arrival = getArrivalDate();

    await page.locator('#yr_arrival')
        .selectOption(arrival.year);

    await page.locator('#mon_arrival')
        .selectOption(arrival.month);

    await page.locator('#day_arrival')
        .selectOption(arrival.day);


    // =====================================
    // 5. DEPARTURE DATE
    // =====================================

    const departure = getDepartureDate();

    await page.locator('#yr_departure')
        .selectOption(departure.year);

    await page.locator('#mon_departure')
        .selectOption(departure.month);

    await page.locator('#day_departure')
        .selectOption(departure.day);


    // =====================================
    // 6. NATIONALITY
    // =====================================

    await page.locator('#nationality_gen')
        .selectOption('50');


    // =====================================
    // 7. CAPTCHA
    // =====================================

    const captchaText = await captchaPromise;

    console.log('Decoded CAPTCHA:', captchaText);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captchaText);


    // =====================================
    // 8. REGISTER
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
    // 9. APPLICANT DETAILS
    // =====================================

    await expect(
        page.locator('#visa_type_0 option:checked')
    ).toHaveText(
        'Transit eVisa - 72 hours, Single entry'
    );

    await page.getByRole('textbox', {
        name: 'Name as per Passport',
        exact: true
    }).fill('testing');

    // Date of Birth
    const dob = getDateOfBirth();

    await page.locator('#yr_dob_0')
        .selectOption(dob.year);

    await page.locator('#mon_dob_0')
        .selectOption(dob.month);

    await page.locator('#day_dob_0')
        .selectOption(dob.day);

    // Surname
    await page.getByRole('textbox', {
        name: 'Surname as per Passport'
    }).fill('testing');

    // Passport number
    await page.locator('#pass_no_0')
        .fill('111');

    // Passport expiry
    const passExp = getPassportExpiryDate();

    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);

    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);

    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    // Passport issue
    const passIssue = getPassportIssueDate();

    await page.locator('#yr_pass_issue_0')
        .selectOption(passIssue.year);

    await page.locator('#mon_pass_issue_0')
        .selectOption(passIssue.month);

    await page.locator('#day_pass_issue_0')
        .selectOption(passIssue.day);


    // =====================================
    // 10. SUBMIT & PREVIEW
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

    // Sometimes the button clicks twice or changes state
    try {
        await page.waitForTimeout(2000);
        await page.getByRole('button', {
            name: 'Submit & Preview'
        }).click();
    } catch {
        console.log('Second Submit & Preview skipped or already handled');
    }

    await page.reload();

    try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
        console.log('Network idle timeout, continuing...');
    }

    // =====================================
    // 11. WAIT FOR UPLOAD PAGE
    // =====================================

    // Wait for the container to appear
    await expect(
        page.locator('[id^="passport_form_"]')
    ).toBeVisible({
        timeout: 15000
    });


    // =====================================
    // 12. UPLOAD FILE WITH API CONFIRMATION
    // =====================================

    const uploadFile = getUploadFile();

    // Find the passport form container dynamically
    const passportFormContainer = page.locator('[id^="passport_form_"]');

    console.log('Uploading Passport Document...');

    // 1. Find the actual file input element inside the container.
    const fileInput = passportFormContainer.locator('input[type="file"]');
    
    // Wait for the file input to exist in the DOM
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });

    if (await fileInput.count() === 0) {
        throw new Error("File input not found in passport form");
    }

    // 2. Start listening for the API response BEFORE triggering the upload
    const uploadApiPromise = waitForUploadApi(
        page, 
        ['upload_temp', 'upload_final'], 
        20000 // 20s timeout for the API response
    );

    // 3. Set the file directly on the input element.
    await fileInput.setInputFiles(uploadFile);

    // 4. Wait for API confirmation
    try {
        await uploadApiPromise;
        console.log('✅ API confirmed: Passport upload successful.');
    } catch (error) {
        console.error('❌ API upload verification failed:', error);
        throw new Error('Passport upload API verification failed');
    }

    // 5. Verify the UI update (Document has been uploaded!)
    await expect(page.getByText('Document has been uploaded!')).toBeVisible({
        timeout: 15000
    });

    console.log('✅ Passport uploaded successfully');

    await page.reload();
    try{
        try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }
    } catch {
        console.log('Network idle timeout after reload, continuing...');
    }

    // =====================================
    // 13. SAVE & CONTINUE
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
    // 14. FINAL ASSERTIONS
    // =====================================

    await expect(
        page.getByRole('heading', {
            name: 'Application Detail'
        })
    ).toBeVisible({
        timeout: 30000
    });

    await page.waitForTimeout(1000);
    await capturescreenshot(page, 'payment-page');

    await expect(
        page.getByText('dm443790@gmail.com')
    ).toBeVisible();


    // =====================================
    // 15. PAYMENT URL
    // =====================================

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

    await page.goto('https://jordan-evisa.info/check-status/');
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

    await page.getByRole('textbox', { name: 'Security Check *' })
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

    await page.goto('https://jordan-evisa.info/complete-partially/');
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

    await page.getByRole('textbox', { name: 'Security Check *' })
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
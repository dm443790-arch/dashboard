import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDepartureDate,
    getDateOfBirth,
    getPassportIssueDate,
    getPassportExpiryDate,
} from '../../utils/date';
import { waitForUploadApi } from '../../utils/apiUpload';

test('ESTA Online Application', async ({ page, waitForCaptcha, getUploadFile }) => {

    // =====================================
    // SET UP CAPTCHA LISTENER BEFORE NAV
    // =====================================

    const captchaPromise = waitForCaptcha(page);


    // =====================================
    // NAVIGATE
    // =====================================

    await page.goto('https://esta-online.it.com/apply-now/');
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
        .fill('87945 61239');

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
        .selectOption('126');


    // =====================================
    // CAPTCHA
    // =====================================

    const captcha = await captchaPromise;
    console.log('Decoded CAPTCHA:', captcha);
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
    // APPLICANT DETAILS
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
    await page.locator('#day_dob_0')
        .selectOption(dob.day);

    const passIssue = getPassportIssueDate();
    await page.locator('#yr_pass_issue_0')
        .selectOption(passIssue.year);
    await page.locator('#mon_pass_issue_0')
        .selectOption(passIssue.month);
    await page.locator('#day_pass_issue_0')
        .selectOption(passIssue.day);

    const passExp = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);
    await page.locator('#day_pass_exp_0')
        .selectOption(passExp.day);

    await page.locator('#pass_no_0')
        .fill('111');
    await page.locator('#city_of_birth_0')
        .fill('testing');
    await page.locator('#address_0')
        .fill('testing');
    await page.locator('#city_0')
        .fill('testing');
    await page.locator('#state_0')
        .fill('testing');
    await page.locator('#occupation_0')
        .selectOption('MEDIA');

    await page.locator('#employer_name_0')
        .fill('testing');
    await page.locator('#emp_address_0')
        .fill('testing');
    await page.locator('#emp_phone_0')
        .fill('testing');
    await page.locator('#father_name_0')
        .fill('testing');
    await page.locator('#mother_name_0')
        .fill('testing');
    await page.locator('#accomodation_address_0')
        .fill('testing');
    await page.locator('#accommodation_city_0')
        .fill('testing');
    await page.locator('#accommodation_state_0')
        .fill('testing');
    await page.locator('#emergency_givenname_0')
        .fill('testing');
    await page.locator('#emergency_phone_0')
        .fill('testing');
    await page.locator('#emergency_email_0')
        .fill('dm443790@gmail.com');


    // =====================================
    // PREVIEW
    // =====================================

    await page.getByRole('button', { name: 'Next' })
        .click();
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
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit & Preview' })
        .click();


    // =====================================
    // UPLOAD FILES (API VERIFICATION)
    // =====================================

    // Wait for document form state to attach
    await page.waitForTimeout(2000);
    await expect(page.locator('[id^="passport_form_"]'))
        .toBeVisible({ timeout: 15000 });

    const uploadFile = getUploadFile();

    // Dynamic locators match any applicant ID without hardcoding
    const passportContainer = page.locator('[id^="passport_form_"]').first();
    const photoContainer = page.locator('[id^="photo_form_"]').first();

    // Helper function to upload with API verification
    async function uploadWithApiVerification(containerLocator: any, uploadFilePath: string, apiAction: string) {
        const fileInput = containerLocator.locator('input[type="file"]');
        const progressBar = page.locator('#top-progress-bar');
        
        // Wait for file input to be attached
        await fileInput.waitFor({ state: 'attached', timeout: 10000 });
        // The site's change handler rejects a new file while its prior loader
        // is active, even though Playwright can still set the input value.
        await expect(progressBar).toBeHidden({ timeout: 15000 });

        // Start listening for API response BEFORE setting file
        const apiPromise = waitForUploadApi(page, [apiAction], 15000);

        // Set the file
        await fileInput.setInputFiles(uploadFilePath);

        // Wait for API response
        const apiResponse = await apiPromise;
        if (!apiResponse) {
            console.warn(`Upload API did not report ${apiAction}; checking the document upload confirmation in the page.`);
        }

        const containerId = await containerLocator.getAttribute('id');
        if (!containerId) throw new Error('Could not identify the ESTA document upload field.');
        const uploadStatusId = containerId.replace('_form_', '_uplod_');
        await expect(page.locator(`#${uploadStatusId}`)).toHaveValue('1', { timeout: 30000 });
        await expect(containerLocator).not.toContainText('Please upload a file!', { timeout: 10000 });
        console.log(`[CONFIRMED] ESTA accepted the document upload: ${containerId}`);
    }

    // Upload Passport Bio Page
    if (await passportContainer.count() > 0) {
        await uploadWithApiVerification(passportContainer, uploadFile, 'upload_temp');
        await page.waitForTimeout(3000);
    }

    // Upload Applicant Photo
    if (await photoContainer.count() > 0) {
        await uploadWithApiVerification(photoContainer, uploadFile, 'upload_temp');
        await page.waitForTimeout(3000);
    }

    try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }
    await expect(page.locator('#top-progress-bar')).toBeHidden({ timeout: 15000 });
    
    // =====================================
    // SAVE & CONTINUE
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


    // =====================================
    // PAYMENT
    // =====================================

    await expect(
        page.getByRole('heading', { name: /Pay Application Processing/ })
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

    await page.goto('https://esta-online.it.com/track-application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'e.g. UA0000000ABC' }).click();
    await page.getByRole('textbox', { name: 'e.g. UA0000000ABC' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Enter passport No.' }).click();
    await page.getByRole('textbox', { name: 'Enter passport No.' }).fill('111');

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

    await page.goto('https://esta-online.it.com/complete-partially/');
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

    await page.getByRole('textbox', { name: 'Enter Code' })
        .fill(partialCaptcha);

    await page.getByRole('button', { name: 'Complete Application' }).click();

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

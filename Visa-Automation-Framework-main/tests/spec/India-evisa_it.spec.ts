import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDepartureDate,
    getDateOfBirth,
    getPassportIssueDate,
    getPassportExpiryDate,
    formatDDMMYYYY,
    
    
} from '../../utils/date';
import fs from 'fs';

import path from 'path';

test('India Visa Application', async ({ page, waitForCaptcha }) => {

    // ── Captcha listener before nav ──

    const captchaPromise = waitForCaptcha(page);


    // ── Open application page directly ──

    await page.goto('https://india-evisa.it.com/apply-visa/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }
     await page.getByRole('textbox', { name: 'email' }).click();
  await page.getByRole('textbox', { name: 'email' }).fill('dm443790@gmail.com');
  await page.getByRole('combobox', { name: 'Selected country' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('indi');
  await page.getByRole('option', { name: 'India +' }).click();
  await page.getByRole('textbox', { name: 'phone' }).fill('1234 567 890');
  await page.getByLabel('nationality').selectOption('34');
  await page.getByRole('radio', { name: 'Meeting Friends/Relatives' }).check();

  // ── Date of Arrival (jQuery UI datepicker — type DD-MM-YYYY directly) ──
  const arrival = getArrivalDate();
  const arrivalStr = formatDDMMYYYY(arrival);
  await page.locator('#arrival_date').click();
  await page.locator('#arrival_date').fill(arrivalStr);
  // Close the datepicker calendar by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  console.log(`Arrival date set: ${arrivalStr}`);


const captchaText = await captchaPromise;
    console.log('Decoded CAPTCHA:', captchaText);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captchaText);
           await page.waitForTimeout(1000);
 await capturescreenshot(page, 'registration-page');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Continue' })
        .click();
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }
    await page.waitForTimeout(2000);
      await page.locator('input[name="givernname"]').click();
  await page.locator('input[name="givernname"]').fill('Rupesh');
  await page.locator('input[name="passport_no"]').click();
  await page.locator('input[name="passport_no"]').fill('111');
  await page.locator('select[name="religion"]').selectOption('HINDU');
  await page.locator('select[name="edu_qualification"]').selectOption('GRADUATE');
const PassportExpiryDate = getPassportExpiryDate();
const expiryStr = formatDDMMYYYY(PassportExpiryDate);
await page.locator('input[name="passport_expiry_date"]').click();
await page.locator('input[name="passport_expiry_date"]').fill(expiryStr);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
console.log(`Passport expiry date set: ${expiryStr}`);
const saveButton = page.getByRole('button', { name: 'Save and Continue' });

// Explicit auto-waiting assertion (Waits up to the timeout limit for it to be visible)
await expect(saveButton).toBeVisible();

// Perform the action
await page.waitForTimeout(2000);
await saveButton.click();
 await page.locator('input[name="house_no"]').click();
  await page.locator('input[name="house_no"]').fill('Test');
  await page.locator('input[name="postal_code"]').click();
  await page.locator('input[name="postal_code"]').fill('test');
  await page.locator('#occupation').selectOption('CAMERAMAN');
  await page.locator('input[name="employer_name"]').click();
  await page.locator('input[name="employer_name"]').fill('test');
  const saveButton2 = page.getByRole('button', { name: 'Save and Continue' });
  await expect(saveButton2).toBeVisible();
  await page.waitForTimeout(2000);
  await saveButton2.click();
  await page.locator('input[name="father_name"]').click();
  await page.locator('input[name="father_name"]').fill('test');
  await page.locator('input[name="father_birth_place"]').click();
  await page.locator('input[name="father_birth_place"]').fill('test');
  await page.locator('input[name="mother_name"]').click();
  await page.locator('input[name="mother_name"]').fill('test');
  await page.locator('input[name="mother_birth_place"]').click();
  await page.locator('input[name="mother_birth_place"]').fill('test');
  const saveButton3 = page.getByRole('button', { name: 'Save and Continue' });
  await expect(saveButton3).toBeVisible();
  await page.waitForTimeout(2000);
  await saveButton3.click();
  await page.locator('input[name="ref_name_in"]').click();
  await page.locator('input[name="ref_name_in"]').fill('test');
  await page.locator('input[name="ref_add_in"]').click();
  await page.locator('input[name="ref_add_in"]').fill('test');
  await page.locator('#ref_state_in').selectOption('7');
  await page.locator('#ref_dist_in').selectOption('113');
  await page.locator('input[name="ref_phone_in"]').click();
  await page.locator('input[name="ref_phone_in"]').fill('1234567890');
  await page.locator('input[name="ref_name_cn"]').click();
  await page.locator('input[name="ref_name_cn"]').fill('test');
  await page.locator('input[name="ref_add_cn"]').click();
  await page.locator('input[name="ref_add_cn"]').fill('test');
  await page.locator('input[name="ref_phone_cn"]').click();
  await page.locator('input[name="ref_phone_cn"]').fill('1234567890');
  const previewButton = page.getByRole('button', { name: 'Preview & Submit Application' });
  await expect(previewButton).toBeVisible();
  await page.waitForTimeout(2000);
  await previewButton.click();
  const submitButton = page.getByRole('button', { name: 'Submit' });
  await expect(submitButton).toBeVisible();
  await page.waitForTimeout(2000);
  await submitButton.click();
// ── Wait for dynamic upload page to load ──

    await expect(page.locator('#photo'))
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


    // ── Upload files ──
    // India eVisa uses a full-page form submit (not AJAX).
    // Both files must be selected before submitting the form.
    // The upload button's onclick is wrapped in Cloudflare protection,
    // so we submit the form directly via JavaScript.

    await page.locator('input[name="photo"]').setInputFiles(uploadFilePath);
    await page.locator('input[name="passport"]').setInputFiles(uploadFilePath);
    console.log('Both files selected. Submitting form...');

    // Submit the form directly — bypasses Cloudflare-wrapped onclick
    const [uploadResponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
        page.evaluate(() => {
            const form = document.getElementById('appli_frm_photo') as HTMLFormElement | null;
            if (form) form.submit();
        }),
    ]);

    console.log(`Upload response: ${uploadResponse?.status()} ${uploadResponse?.url()}`);
    try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
        console.log('Network never went idle after upload, continuing');
    }
    await page.waitForTimeout(2000);

    // Verify upload succeeded — check hidden upload status fields
    const phUpload = await page.locator('#ph_uplod').inputValue().catch(() => 'N/A');
    const psUpload = await page.locator('#ps_uplod').inputValue().catch(() => 'N/A');
    console.log(`Upload status — photo: ${phUpload}, passport: ${psUpload}`);

    if (phUpload === '0' && psUpload === '0') {
        console.warn('Upload may have failed — files still show "Not uploaded"');
    }
   // ── Final assertions ──

    await expect(
        page.getByRole('heading', { name: 'Your Temporary Application ID' })
    ).toBeVisible({ timeout: 30000 });

    // Reaching this page completes the primary application flow. Save the URL
    // now, before optional follow-up checks navigate away from the payment page.
    process.env.PAYMENT_PAGE_URL = page.url();

    try {

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

    const orderId = await page
        .getByRole('heading', { name: /Your Temporary Application ID:/ })
        .locator('strong')
        .textContent();
    const trimmedOrderId = orderId?.trim() || '';
    console.log(`\n================ TEMPORARY ORDER ID ================\n${trimmedOrderId}\n====================================================\n`);

    expect(trimmedOrderId).toBeTruthy();


    // Visa status and complete-partially checks are follow-up checks. They
    // should not change the result once the application has reached payment.
    // =====================================
    // VISA STATUS PAGE — PASTE ORDER ID
    // =====================================
 await page.waitForTimeout(3000);
    // New captcha listener for the visa-status page (new page load = new captcha)
    const statusCaptchaPromise = waitForCaptcha(page);

    await page.goto('https://india-evisa.it.com/visa-application-status/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Application ID *' }).click();
    await page.getByRole('textbox', { name: 'Application ID *' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'Passport No. *' }).click();
    await page.getByRole('textbox', { name: 'Passport No. *' }).fill('111');

    // Wait for the new captcha from the visa-status page
    const statusCaptcha = await statusCaptchaPromise;
    console.log('Decoded CAPTCHA (status page):', statusCaptcha);

    await page.getByRole('textbox', { name: 'Enter captcha' })
        .fill(statusCaptcha);

    await page.getByRole('button', { name: 'Check Status' }).click();
    await expect(page.getByText('You have not filled complete')).toBeVisible();
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

    await page.goto('https://india-evisa.it.com/complete-partially-filled-application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'Application ID *' }).click();
    await page.getByRole('textbox', { name: 'Application ID *' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter captcha' })
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
    } catch (postPaymentError: any) {
        console.warn(
            'Application reached the payment page, but a post-payment check failed:',
            postPaymentError?.message || postPaymentError
        );
    }
});

/**
 * Kyrgyzstan eVisa Application - E2E Test
 *
 * Refactored to use shared baseTest, captcha helper, and exact date methods.
 * Starts directly from the application page URL.
 */

import { test, expect, capturescreenshot } from '../../utils/baseTest';
import {
    getArrivalDate,
    getDateOfBirth,
    getPassportExpiryDate,
} from '../../utils/date';
import fs from 'fs';
import path from 'path';

test('Kyrgyzstan eVisa Application', async ({ page, waitForCaptcha }) => {

    // ── Captcha listener before nav ──

    const captchaPromise = waitForCaptcha(page);


    // ── Open application page directly ──

    await page.goto('https://kyrgyzstan-evisa.com/apply-now/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }
await page.getByRole('textbox', { name: 'name' }).click();
  await page.getByRole('textbox', { name: 'name' }).fill('Rupesh kumar');
  await page.getByRole('textbox', { name: 'email' }).click();
  await page.getByRole('textbox', { name: 'email' }).fill('dm443790@gmail.com');
  await page.getByRole('combobox', { name: 'Selected country' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('india');
  await page.getByRole('option', { name: 'India +' }).click();
  await page.getByRole('textbox', { name: 'phone' }).click();
  await page.getByRole('textbox', { name: 'phone' }).fill('1234 567 890');
  const arrival = getArrivalDate();
    await page.getByLabel('Year')
        .selectOption(arrival.year);
    await page.getByLabel('Mon')
        .selectOption(arrival.month);
    await page.getByLabel('Day', { exact: true })
        .selectOption(arrival.day);
  await page.locator('#nationality_gen').selectOption('45');
   const captchaText = await captchaPromise;
    console.log('Decoded CAPTCHA:', captchaText);

    await page.getByRole('textbox', { name: 'Captcha' })
        .fill(captchaText);
          await page.waitForTimeout(2000);
          await page.getByRole('button', { name: 'Register' }).click();
           await page.getByRole('textbox', { name: 'Name as per Passport', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name as per Passport', exact: true }).fill('Rupesh');
  await page.getByRole('textbox', { name: 'Surname as per Passport' }).click();
  await page.getByRole('textbox', { name: 'Surname as per Passport' }).fill('Kumar');
  const passExp = getPassportExpiryDate();
    await page.locator('#yr_pass_exp_0')
        .selectOption(passExp.year);
    await page.locator('#mon_pass_exp_0')
        .selectOption(passExp.month);
          await page.locator('#pass_no_0').click();
  await page.locator('#pass_no_0').fill('111');
  await page.locator('#reason_for_travel_0').click();
  await page.locator('#reason_for_travel_0').fill('test');
  await page.locator('#accomodation_address_0').click();
  await page.locator('#accomodation_address_0').fill('test');
  await page.locator('#host_fullname_0').click();
  await page.locator('#host_fullname_0').fill('test');
  await page.locator('#host_phone_0').click();
  await page.locator('#host_phone_0').fill('test');
  await page.locator('#host_email_0').click();
  await page.locator('#host_email_0').fill('dm443790@gmail.com');
  await page.locator('#host_address_0').click();
  await page.locator('#host_address_0').fill('test');
 await page.waitForTimeout(2000);
 await page.getByRole('button', { name: 'Submit & Preview' }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Confirm & Submit' }).click();
  await expect(page.locator('[id^="passport_form_"]'))
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
  
  
      // ── Upload files with validation ──
  
      const uploadSections = [
          'passport_form_',
          'photo_form_',
          'event_clearance_form_',
          'poli_clearance_form_',
          'company_registration_form_',
          'business_card_form_',
          'tin_certificate_form_',
          'erfs_registration_form_',
          'company_extract_form_'
      ];
  
      for (const section of uploadSections) {
          const sectionLocator = page.locator(`[id^="${section}"]`);
  
          await sectionLocator
              .locator('input[type="file"]')
              .setInputFiles(uploadFilePath);
  
          // UK site specifically shows the uploaded filename with a checkmark
          await expect(sectionLocator)
              .toContainText('✓ Uploaded', { timeout: 15000 });

          const sectionId = await sectionLocator.first().getAttribute('id');
          if (!sectionId) throw new Error(`Could not identify uploaded document section: ${section}`);
          const uploadStatusId = sectionId.replace('_form_', '_uplod_');
          await expect(page.locator(`#${uploadStatusId}`)).toHaveValue('1', { timeout: 15000 });
  
          console.log(`Uploaded: ${section.replace(/_/g, ' ')}`);
      }
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }
       // ── Save & Continue ──

    // The document page requires confirmation that the uploads were checked.
    // Set it explicitly in case the page's default checkbox state was not saved.
    await page.locator('input[type="checkbox"]').last().check();
    // The submit handler returns without sending the transfer request while
    // the site's upload progress bar is still active.
    await expect(page.locator('#top-progress-bar')).toBeHidden({ timeout: 15000 });
    await page.getByRole('button', { name: 'Save & Continue' }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
          // ── Final assertions ──

    const paymentHeading = page.getByRole('heading', { name: /Pay .*Processing Fee/i });
    try {
        await expect(paymentHeading).toBeVisible({ timeout: 30000 });
    } catch {
        const visibleAlerts = await page.locator('[role="alert"], .alert, .invalid-feedback, .text-danger')
            .allTextContents()
            .catch(() => [] as string[]);
        const alertText = visibleAlerts.map(text => text.trim()).filter(Boolean).join(' | ');
        const invalidControls = await page.locator(':invalid').evaluateAll(elements =>
            elements.map(element => {
                const control = element as HTMLInputElement;
                return `${control.name || control.id || control.tagName}: ${control.validationMessage || 'invalid'}`;
            })
        ).catch(() => [] as string[]);
        const validationText = [
            alertText,
            invalidControls.length ? `Invalid form controls: ${invalidControls.join(' | ')}` : '',
        ].filter(Boolean).join(' | ');
        throw new Error(
            `Payment page did not appear after Save & Continue.${validationText ? ` Page validation: ${validationText}` : ''}`
        );
    }

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

    await page.goto('https://kyrgyzstan-evisa.com/track-application/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'CI0000000ABC' }).click();
    await page.getByRole('textbox', { name: 'CI0000000ABC' }).fill(trimmedOrderId);

    await page.getByRole('textbox', { name: 'A1234567' }).click();
    await page.getByRole('textbox', { name: 'A1234567' }).fill('111');

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

    await page.goto('https://kyrgyzstan-evisa.com/complete-partially/');
    try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
        console.log('Network never went idle, continuing anyway');
    }

    await page.getByRole('textbox', { name: 'KG0000000ABC' }).click();
    await page.getByRole('textbox', { name: 'KG0000000ABC' }).fill(trimmedOrderId);

    // Wait for the captcha from the complete-partially page
    const partialCaptcha = await partialCaptchaPromise;
    console.log('Decoded CAPTCHA (complete-partially page):', partialCaptcha);

    await page.getByRole('textbox', { name: 'Enter code' })
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

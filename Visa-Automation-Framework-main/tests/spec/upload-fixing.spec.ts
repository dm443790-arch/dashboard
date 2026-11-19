import { test, expect } from '../../utils/baseTest';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://kyrgyzstan-evisa.com/document-upload/S0cwNDg4ODU3R0hN/';
const APPLICANT_ID = '345267';

const uploadSections = [
  'passport_form_',
  'photo_form_'
  
] as const;

// DOM-only verification: never inspect network traffic or API responses.
// If the site uses a different success label, adjust this to match its actual UI.
const uploadedState = /(?:✓\s*)?Uploaded|Upload(?:ed)?\s+successfully/i;

test('Kyrgyzstan document uploads persist after reload (UI only)', async ({ page, getUploadFile }) => {
  test.setTimeout(240_000);
  const uploadFilePath = getUploadFile();
  if (!fs.existsSync(uploadFilePath)) {
    throw new Error(`Upload file not found: ${uploadFilePath}`);
  }
  const filename = path.basename(uploadFilePath);

  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  for (const prefix of uploadSections) {
    await test.step(`Upload and verify visible UI: ${prefix}`, async () => {
      const section = page.locator(`#${prefix}${APPLICANT_ID}`);
      await expect(section).toBeAttached();
      const fileInput = section.locator('input[type="file"]');
      await expect(fileInput).toHaveCount(1);
      await fileInput.setInputFiles(uploadFilePath);
      // Check actual rendered text in the upload section, not the API.
      await expect(section, `No upload confirmation shown for ${prefix}`)
        .toContainText(uploadedState, { timeout: 30_000 });
      console.log(`UI confirms upload for ${prefix}: ${filename}`);
    });
  }

  await page.reload({ waitUntil: 'domcontentloaded' });

  for (const prefix of uploadSections) {
    const section = page.locator(`#${prefix}${APPLICANT_ID}`);
    await expect(section, `Missing after reload: ${prefix}`).toBeAttached();
    await expect(section, `Upload not visible after reload: ${prefix}`)
      .toContainText(uploadedState, { timeout: 30_000 });
  }

  await expect(page.locator('#photo_form_345267')).toContainText('Applicant Photo');

  await page.locator('div').filter({ hasText: /^Passport Bio Page$/ }).click();
  await page.getByRole('button', { name: '×' }).click();
  await expect(page.locator('#passport_form_345267')).toContainText('Passport Bio Page');

  await expect(page.locator('#event_clearance_form_345267')).toContainText('Reference from authorized state body in the sphere of migration, or on the basis of the document on accreditation of journalists and correspondents');
  await expect(page.locator('#poli_clearance_form_345267')).toContainText('Written invitation from the inviting organization (state office of Kyrgyz Republic or a legal entity, registered on the territory of Kyrgyz Republic)');
  await expect(page.locator('#company_registration_form_345267')).toContainText('Certificate of registration in the justice authority of the Kyrgyz Republic');
  await expect(page.locator('div').filter({ hasText: /^Certificates from the social fund on the absence of debt$/ })).toBeVisible();
  await expect(page.locator('#erfs_registration_form_345267')).toContainText('Certificates from the tax authority on the absence of debt');
  await expect(page.locator('#tin_certificate_form_345267')).toContainText('Charter of an organization');
  await expect(page.locator('#business_card_form_345267')).toContainText('Founders agreement of an organization');
});
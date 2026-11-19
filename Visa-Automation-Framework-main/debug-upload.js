const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  console.log('Navigating to application page...');
  await page.goto('https://turkey-evisa.it.com/application/', { waitUntil: 'domcontentloaded' });

  // Wait for Cloudflare challenge to clear
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch (e) {
    console.log('networkidle timeout, continuing');
  }

  const cf = page.getByText('Performing security verification');
  if (await cf.isVisible().catch(() => false)) {
    console.log('Cloudflare challenge detected, waiting...');
    await cf.waitFor({ state: 'detached', timeout: 30000 });
  }

  // Wait for the form
  await page.getByRole('textbox', { name: 'Name' }).waitFor({ state: 'visible', timeout: 30000 });
  console.log('Form loaded. Filling in details...');

  // Fill in the form quickly
  await page.getByRole('textbox', { name: 'Name' }).fill('testing');
  await page.getByRole('textbox', { name: 'Email ID *' }).fill('dm443790@gmail.com');
  await page.getByRole('combobox', { name: 'Selected country' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('ind');
  await page.getByRole('option', { name: 'India +' }).click();
  await page.getByRole('textbox', { name: 'Phone *' }).fill('78945 61239');
  await page.getByLabel('Nationality *').selectOption('89');

  // Arrival date
  const arrival = { year: '2026', month: '10', day: '30' };
  await page.getByLabel('Arrival Year').selectOption(arrival.year);
  await page.getByLabel('Arrival Month').selectOption(arrival.month);
  await page.getByLabel('Date of Arrival in Turkey *').selectOption(arrival.day);

  // Captcha
  const captchaPromise = page.waitForResponse(
    r => r.url().includes('create_captcha.php') || r.url().includes('get_captcha.php'),
    { timeout: 60000 }
  );
  const captchaResp = await captchaPromise;
  const data = await captchaResp.json();
  const field = captchaResp.url().includes('create_captcha.php') ? 'd' : 'c';
  let captchaText = data[field];
  for (let i = 0; i < 3; i++) {
    try { captchaText = Buffer.from(captchaText, 'base64').toString('utf8'); } catch (e) { break; }
  }
  console.log('Captcha:', captchaText);
  await page.getByRole('textbox', { name: 'Captcha' }).fill(captchaText);

  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Given/First Name as per' }).waitFor();

  // Applicant details
  await page.getByRole('textbox', { name: 'Given/First Name as per' }).fill('testing');
  await page.locator('#pass_no_0').fill('111');
  await page.locator('#city_of_birth_0').fill('testing');
  await page.locator('#father_name_0').fill('testing');
  await page.locator('#mother_name_0').fill('testing');
  await page.getByRole('textbox', { name: 'Surname as per Passport' }).fill('testing');

  // Passport dates
  await page.locator('#yr_pass_exp_0').selectOption('2031');
  await page.locator('#mon_pass_exp_0').selectOption('10');
  await page.locator('#day_pass_exp_0').selectOption('30');
  await page.locator('#yr_pass_issue_0').selectOption('2026');
  await page.locator('#mon_pass_issue_0').selectOption('4');
  await page.locator('#day_pass_issue_0').selectOption('30');

  // DOB
  await page.locator('#yr_dob_0').selectOption('2001');
  await page.locator('#mon_dob_0').selectOption('10');
  await page.locator('#day_dob_0').selectOption('24');

  await page.locator('#type_of_support_doc_0').selectOption('Visa');
  await page.locator('#support_doc_country_0').selectOption('145');
  await page.getByRole('checkbox', { name: 'Unlimited' }).check();
  await page.locator('#sup_issue_date_0').click();
  await page.getByRole('link', { name: '10' }).click();
  await page.locator('#support_doc_no_0').fill('testing');

  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Submit & Preview' }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Confirm & Submit' }).click();

  // Wait for upload page
  await page.waitForURL(/document-upload/, { timeout: 30000 });
  console.log('On upload page:', page.url());
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // Inspect file inputs
  const fileInputs = await page.locator('input[type="file"]').count();
  console.log('Number of input[type="file"]:', fileInputs);

  // Get all file input details
  const inputs = await page.locator('input[type="file"]').all();
  for (let i = 0; i < inputs.length; i++) {
    const visible = await inputs[i].isVisible().catch(() => false);
    const name = await inputs[i].getAttribute('name').catch(() => 'N/A');
    const id = await inputs[i].getAttribute('id').catch(() => 'N/A');
    const accept = await inputs[i].getAttribute('accept').catch(() => 'N/A');
    console.log(`  input[${i}]: visible=${visible}, name=${name}, id=${id}, accept=${accept}`);
  }

  // Check for "Select file to upload" elements
  const selectFileEls = await page.getByText('Select file to upload').all();
  console.log('Number of "Select file to upload" elements:', selectFileEls.length);
  for (let i = 0; i < selectFileEls.length; i++) {
    const tag = await selectFileEls[i].evaluate(el => el.tagName).catch(() => 'N/A');
    const parentTag = await selectFileEls[i].evaluate(el => el.parentElement?.tagName).catch(() => 'N/A');
    const parentHTML = await selectFileEls[i].evaluate(el => el.parentElement?.outerHTML?.substring(0, 200)).catch(() => 'N/A');
    console.log(`  selectFile[${i}]: tag=${tag}, parentTag=${parentTag}`);
    console.log(`    parentHTML: ${parentHTML}`);
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-upload-page.png', fullPage: true });
  console.log('Screenshot saved to debug-upload-page.png');

  await browser.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

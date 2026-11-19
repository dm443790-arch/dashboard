/**
 * contactUs.ts
 *
 * Best-effort "Contact Us" form submission that runs after a test script
 * finishes. Triggered only when the dashboard's "Contact Us" execution
 * parameter is enabled (CONTACT_US_ENABLED === 'true').
 *
 * Each site has its own locator config since form structures differ.
 * Any failure here is logged but never thrown, so it does not affect
 * the passing script's result.
 */

import { Page, expect, Locator } from '@playwright/test';
import { captureScreenshot } from './screenshot';
import { waitForPageLoad } from './pageLoad';

// ─── Proxy helpers ────────────────────────────────────────────────────────────



// ─── Per-site form config ─────────────────────────────────────────────────────

interface ContactUsField {
  /** How to locate the field */
  locator: (page: Page) => Locator;
  /** Value to fill */
  value: string;
  /** If true, the field is a combobox/dropdown — click, type search, pick option */
  isDropdown?: boolean;
  /** Search text to type into the dropdown's search box */
  searchValue?: string;
  /** Exact text of the option to click after searching (used when optionLocator is not set) */
  optionText?: string;
  /** Custom locator for the option to click after searching (overrides optionText) */
  optionLocator?: (page: Page) => Locator;
  /** If true, use dblclick instead of click before filling */
  dblClick?: boolean;
  /** Optional: locator to click before filling this field (e.g., a tab or section header) */
  preClickLocator?: (page: Page) => Locator;
}

interface ContactUsSiteConfig {
  /** Spec key that triggers this site (matches the spec filename without extension, e.g. 'azerbaijan-visa') */
  specKey: string;
  /** Human-readable name for logging */
  name: string;
  /** URL of the Contact Us page */
  url: string;
  /** Ordered list of fields to fill */
  fields: ContactUsField[];
  /** Locator for the submit button */
  submitButton: (page: Page) => Locator;
  /** Locator for the success confirmation message */
  successMessage: (page: Page) => Locator;
  /** Optional: screenshot name to capture after success is visible */
  screenshotName?: string;
}

// ─── Site definitions ─────────────────────────────────────────────────────────

const CONTACT_US_SITES: ContactUsSiteConfig[] = [
  {
    specKey: 'bahrain-visa',
    name: 'Bahrain ETA',
    url: 'https://bahrain-eta.it.com/contact-us/',
    fields: [
      {
        locator: (p) => p.locator('#name'),
        value: 'Rupesgh',
      },
      {
        locator: (p) => p.locator('#email'),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionText: 'India',
      },
      {
        locator: (p) => p.locator('#phone'),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.locator('#comment_act'),
        value: 'test test test test test test est test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('Thank you! We\u2019ve received'),
  },

  {
    specKey: 'azerbaijan-visa',
    name: 'Azerbaijan Visa',
    url: 'https://azerbaijan-visa.info/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'name' }),
        value: 'Rupesh Kumar',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'email' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionText: 'India',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'phone' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'message' }),
        value: 'test test test test test test test test test test test test',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send' }),
    successMessage: (p) => p.getByText('\u2713 Successfully submitted!'),
    screenshotName: 'contact-us-azerbaijan-success',
  },

  {
    specKey: 'benin-e-visa',
    name: 'Benin E-Visa',
    url: 'https://benin-e-visa.com/contact-us/',
    fields: [
      {
        locator: (p) => p.locator('#name'),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.locator('#email'),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByLabel('List of countries').getByText('+91'),
      },
      {
        locator: (p) => p.locator('#phone'),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.locator('#message'),
        value: 'test test test test test test test test test test test test testtes ttest test test test test test test test test teest test test test test test tes tes testt est',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('Your message has been sent.'),
    screenshotName: 'contact-us-benin-success',
  },

  {
    specKey: 'brazil-evisa',
    name: 'Brazil E-Visa',
    url: 'https://brazil-evisa.info/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Description *' }),
        value: 'test test test test test test test test test test test test test test test test test test test test tets ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('We appreciate your message.'),
    screenshotName: 'contact-us-brazil-success',
  },

  {
    specKey: 'burkina-faso-evisa',
    name: 'Burkina Faso E-Visa',
    url: 'https://burkina-faso-evisa.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Name' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Email' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionText: 'India',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message' }),
        value: 'test test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Thank you for reaching out.'),
    screenshotName: 'contact-us-burkina-faso-success',
  },

  {
    specKey: 'cambodia-evisa',
    name: 'Cambodia E-Visa',
    url: 'https://cambodia-evisa.info/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByLabel('List of countries').getByText('+91'),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test testtest test test test test test test test test test test test tets test test est e',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: ' Send Message' }),
    successMessage: (p) => p.getByText('We\u2019ve logged your inquiry and'),
    screenshotName: 'contact-us-cambodia-success',
  },

  {
    specKey: 'cameroon-visa',
    name: 'Cameroon Visa',
    url: 'https://visit-cameroon.info/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Full Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test test test test test test test test test test test test test',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('Thank you! Your message has'),
    screenshotName: 'contact-us-cameroon-success',
  },

  {
    specKey: 'congo-evisa',
    name: 'Congo E-Visa',
    url: 'https://congo-evisa.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test test',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Query delivered successfully'),
    screenshotName: 'contact-us-congo-success',
  },

  {
    specKey: 'djibouti-evisa',
    name: 'Djibouti E-Visa',
    url: 'https://online.djibouti-evisa.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionText: 'India',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Thank you! Your message has'),
    screenshotName: 'contact-us-djibouti-success',
  },

  {
    specKey: 'e-visa-cambodia',
    name: 'E-Visa Cambodia',
    url: 'https://e-visa-cambodia.com/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name*' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email*' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone*' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Description*' }),
        value: 'test test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('Thank you, your message sent'),
    screenshotName: 'contact-us-e-visa-cambodia-success',
  },

  {
    specKey: 'ecuador-evisa',
    name: 'Ecuador E-Visa',
    url: 'https://ecuador-evisa.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByLabel('List of countries').getByText('+91'),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message' }),
        value: 'test test test test test test test test test test test test test etst test test tets ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Our team has your details and'),
    screenshotName: 'contact-us-ecuador-success',
  },

  {
    specKey: 'egypt-eta',
    name: 'Egypt ETA',
    url: 'https://egypt-eta.com/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Description *' }),
        value: 'test test test test test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('Thank you, your message sent'),
    screenshotName: 'contact-us-egypt-success',
  },

  {
    specKey: 'esta-online',
    name: 'ESTA Online',
    url: 'https://esta-online.it.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
        dblClick: true,
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Thank you\u2014your message has'),
    screenshotName: 'contact-us-esta-success',
  },

  {
    specKey: 'eta-canada',
    name: 'ETA Canada',
    url: 'https://eta-canada.info/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Full Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Description *' }),
        value: 'test test test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('Thank you! Your message has'),
    screenshotName: 'contact-us-eta-canada-success',
  },

  {
    specKey: 'ethiopia-e-visa',
    name: 'Ethiopia E-Visa',
    url: 'https://ethiopia-e-visa.com/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Description' }),
        value: 'test test test test test test test test tets',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit Message' }),
    successMessage: (p) => p.getByText('We\u2019ve successfully received'),
    screenshotName: 'contact-us-ethiopia-success',
  },

  {
    specKey: 'evisa-egypt',
    name: 'E-Visa Egypt',
    url: 'https://eta-egypt.info/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Description *' }),
        value: 'trest test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Submit' }),
    successMessage: (p) => p.getByText('We\u2019ve got your message! Thank'),
    screenshotName: 'contact-us-evisa-egypt-success',
  },

  {
    specKey: 'evisa-gabon',
    name: 'E-Visa Gabon',
    url: 'https://evisa-gabon.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test tets testt ets tetst ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: ' Send Message' }),
    successMessage: (p) => p.getByText('Thank you for contacting us.'),
    screenshotName: 'contact-us-gabon-success',
  },

  {
    specKey: 'evisa-iraq',
    name: 'E-Visa Iraq',
    url: 'https://evisa-iraq.org/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Full Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email Address *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'How can we help you? *' }),
        value: 'test test test test test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Thank you for contacting us.'),
    screenshotName: 'contact-us-iraq-success',
  },

  {
    specKey: 'evisa-madagascar',
    name: 'E-Visa Madagascar',
    url: 'https://evisa-madagascar.it.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Your Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test test ets ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Thank you! Your message has'),
    screenshotName: 'contact-us-madagascar-success',
  },

  {
    specKey: 'evisa-mongolia',
    name: 'E-Visa Mongolia',
    url: 'https://evisa-mongolia.com/contact/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Name *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Email *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Phone Number *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message *' }),
        value: 'test test test test test test test test test ',
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Send Message' }),
    successMessage: (p) => p.getByText('Thank you! We will get back'),
    screenshotName: 'contact-us-mongolia-success',
  },

  {
    specKey: 'evisa-myanmar',
    name: 'E-Visa Myanmar',
    url: 'https://evisa-myanmar.com/contact-us/',
    fields: [
      {
        locator: (p) => p.getByRole('textbox', { name: 'Enter your name: *' }),
        value: 'Rupesh',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Enter your Email: *' }),
        value: 'dm443790@gmail.com',
      },
      {
        locator: (p) => p.getByRole('combobox', { name: 'Selected country' }),
        value: '',
        isDropdown: true,
        searchValue: 'india',
        optionLocator: (p) => p.getByRole('option', { name: 'India +' }),
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Enter your phone: *' }),
        value: '1234 567 890',
      },
      {
        locator: (p) => p.getByRole('textbox', { name: 'Message: *' }),
        value: 'test test test test test test test test test test test ',
        preClickLocator: (p) => p.locator('#formCheckRe div').filter({ hasText: 'Message: *' }).nth(2),
      },
    ],
    submitButton: (p) => p.getByRole('button', { name: 'Get In touch' }),
    successMessage: (p) => p.getByText('Your message sent'),
    screenshotName: 'contact-us-myanmar-success',
  },

  // ── Add more sites below ──────────────────────────────────────────────────
];

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Fill and submit a single Contact Us form on the given page.
 */
interface ContactUsResult {
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'CAPTCHA_BLOCKED';
  screenshotPath: string | null;
  reason?: string;
}

/**
 * Block server-side captcha functions (check_gcaptcha_v_2, check_gcaptcha_v2)
 * by intercepting the page request and stripping captcha-related code from
 * the HTML response, and by stubbing any client-side captcha verification.
 */
async function blockCaptchaFunctions(page: Page): Promise<void> {
  // Rewrite only document responses; fetching and then continuing other
  // requests would send form POSTs twice.
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.continue();
      return;
    }

    const response = await route.fetch();
    const contentType = response.headers()['content-type'] || '';

    if (contentType.includes('text/html')) {
      let body = await response.text();

      // Remove captcha-related script blocks and inline handlers
      // that the PHP check_gcaptcha_v_2 / check_gcaptcha_v2 functions inject
      body = body
        // Remove any <script> blocks that reference check_gcaptcha
        .replace(/<script[^>]*>[\s\S]*?check_gcaptcha[^<]*<\/script>/gi, '')
        // Remove inline onclick/onsubmit handlers referencing check_gcaptcha
        .replace(/(on\w+|onclick|onsubmit)\s*=\s*["'][^"']*check_gcaptcha[^"']*["']/gi, '')
        // Remove captcha form fields (hidden inputs, image inputs, text inputs)
        .replace(/<input[^>]*captcha[^>]*>/gi, '')
        .replace(/<input[^>]*gcaptcha[^>]*>/gi, '')
        .replace(/<img[^>]*captcha[^>]*>/gi, '')
        // Remove captcha divs/containers
        .replace(/<div[^>]*captcha[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*gcaptcha[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove reCAPTCHA iframes
        .replace(/<iframe[^>]*recaptcha[^>]*>[\s\S]*?<\/iframe>/gi, '')
        // Remove hCaptcha iframes
        .replace(/<iframe[^>]*hcaptcha[^>]*>[\s\S]*?<\/iframe>/gi, '')
        // Remove reCAPTCHA script tags
        .replace(/<script[^>]*recaptcha[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<script[^>]*src="[^"]*recaptcha[^"]*"[^>]*>[\s\S]*?<\/script>/gi, '');

      await route.fulfill({ response, body });
    } else {
      await route.fulfill({ response });
    }
  });

  // Stub out any client-side captcha verification functions that PHP may inject
  await page.addInitScript(() => {
    // Override common captcha verification function names
    (window as any).check_gcaptcha_v_2 = () => true;
    (window as any).check_gcaptcha_v2 = () => true;
    (window as any).checkGcaptchaV2 = () => true;
    (window as any).checkGcaptchaV_2 = () => true;
    (window as any).validateCaptcha = () => true;
    (window as any).verifyCaptcha = () => true;
  });
}

async function getVisibleContactFormError(page: Page): Promise<string> {
  const visibleErrors = await page.locator('form').evaluateAll((forms) =>
    forms.flatMap((form) =>
      Array.from(form.querySelectorAll(
        '[role="alert"], .error, .error-message, .invalid-feedback, .wpcf7-response-output, [aria-invalid="true"]'
      ))
        .filter((element) => (element as HTMLElement).getClientRects().length > 0)
        .map((element) => element.textContent?.replace(/\s+/g, ' ').trim())
        .filter((text): text is string => Boolean(text))
    )
  );

  if (visibleErrors.length) {
    return Array.from(new Set(visibleErrors)).slice(0, 5).join(' | ');
  }

  const browserValidationMessages = await page.locator('form :invalid').evaluateAll((fields) =>
    fields
      .map((field) => (field as HTMLInputElement).validationMessage)
      .filter(Boolean)
  );

  return Array.from(new Set(browserValidationMessages)).slice(0, 5).join(' | ');
}

async function fillAndSubmit(page: Page, site: ContactUsSiteConfig): Promise<ContactUsResult> {
  console.log(`[contactUs] Opening ${site.name} (${site.url})`);

  // Block captcha functions before navigating to the page
  await blockCaptchaFunctions(page);

  await page.goto(site.url);
  await waitForPageLoad(page);

  for (const field of site.fields) {
    const el = field.locator(page);

    if (field.isDropdown) {
      await el.click();
      // Type into the search box inside the dropdown
      const searchBox = page.getByRole('combobox', { name: 'Search' });
      await searchBox.fill(field.searchValue!);
      if (field.optionLocator) {
        await field.optionLocator(page).click();
      } else {
        await page.getByText(field.optionText!, { exact: true }).click();
      }
    } else {
      if (field.preClickLocator) {
        await field.preClickLocator(page).click();
      }
      if (field.dblClick) {
        await el.dblclick();
      } else {
        await el.click();
      }
      await el.fill(field.value);
    }
  }

  // Capture a screenshot after filling the form (before submit) as evidence
  let filledScreenshot: string | null = null;
  if (site.screenshotName) {
    filledScreenshot = await captureScreenshot(page, `${site.screenshotName}-filled`);
  }

  // Detect if a CAPTCHA is present before attempting submit
  const captchaDetected = await detectCaptcha(page);
  if (captchaDetected) {
    console.warn(`[contactUs] ${site.name} CAPTCHA detected — form cannot be submitted automatically.`);
    const captchaScreenshot = await captureScreenshot(
      page,
      `${site.screenshotName || `contact-us-${site.specKey}`}-captcha`
    );
    return { status: 'CAPTCHA_BLOCKED', screenshotPath: captchaScreenshot || filledScreenshot };
  }

  let successVisible = false;
  let submitResponseStatus: number | null = null;
  let submitResponseOrigin = '';
  let submitResponsePath = '';
  let submitRequestFailure = '';
  const siteOrigin = new URL(site.url).origin;
  const onContactResponse = (response: import('@playwright/test').Response) => {
    const request = response.request();
    let responseUrl: URL;
    try {
      responseUrl = new URL(response.url());
    } catch {
      return;
    }
    if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
      submitResponseStatus = response.status();
      submitResponseOrigin = responseUrl.origin;
      submitResponsePath = responseUrl.pathname;
    }
  };
  const onContactRequestFailed = (request: import('@playwright/test').Request) => {
    try {
      const requestUrl = new URL(request.url());
      if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
        submitRequestFailure = `${requestUrl.origin}${requestUrl.pathname}: ${request.failure()?.errorText || 'request failed'}`;
      }
    } catch {
      // Ignore malformed request URLs.
    }
  };

  page.on('response', onContactResponse);
  page.on('requestfailed', onContactRequestFailed);
  try {
    await site.submitButton(page).click();
    try {
      await expect(site.successMessage(page)).toBeVisible({ timeout: 4000 });
      successVisible = true;
    } catch {
      const genericSuccess = page.getByText(
        /thank\s*you|we appreciate your message|message.{0,30}(sent|received)|query.{0,30}delivered|submitted successfully/i
      ).first();
      await expect(genericSuccess).toBeVisible({ timeout: 6000 });
      successVisible = true;
    }
  } catch {
    console.log(`[contactUs] ${site.name} success message not visible after submit (possible CAPTCHA or site change).`);
  } finally {
    page.off('response', onContactResponse);
    page.off('requestfailed', onContactRequestFailed);
  }

  const formError = successVisible ? '' : await getVisibleContactFormError(page).catch(() => '');
  const reason = successVisible
    ? undefined
    : formError || (submitRequestFailure
      ? `Contact form request failed: ${submitRequestFailure}.`
      : submitResponseStatus !== null && submitResponseStatus >= 400
        ? `Contact form request to ${submitResponseOrigin}${submitResponsePath} returned HTTP ${submitResponseStatus}.`
        : submitResponseStatus !== null
          ? `Contact form request to ${submitResponseOrigin}${submitResponsePath} returned HTTP ${submitResponseStatus}, but no success confirmation appeared.`
          : `No POST/PUT/PATCH response was observed for the Contact Us submission on ${siteOrigin}, and no success confirmation appeared.`);
  const screenshotBase = site.screenshotName || `contact-us-${site.specKey}`;
  const screenshotPath = await captureScreenshot(
    page,
    successVisible ? screenshotBase : `${screenshotBase}-failed`
  );

  if (successVisible) {
    console.log(`[contactUs] ${site.name} form submitted successfully.`);
    return { status: 'PASS', screenshotPath };
  } else {
    console.warn(`[contactUs] ${site.name} form could not be confirmed as submitted: ${reason}`);
    return { status: 'FAIL', screenshotPath, reason };
  }
}

async function fillAndSubmitGenericContactForm(page: Page, specKey: string): Promise<ContactUsResult> {
  let baseUrl: URL;
  try {
    baseUrl = new URL(page.url());
  } catch {
    return { status: 'SKIPPED', screenshotPath: null };
  }

  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    return { status: 'SKIPPED', screenshotPath: null };
  }

  const contactLink = await page.locator('a[href]').evaluateAll((anchors) => {
    const link = anchors.find((anchor) => {
      const text = anchor.textContent || '';
      const href = anchor.getAttribute('href') || '';
      return /contact/i.test(`${text} ${href}`);
    });
    return link?.getAttribute('href') || null;
  });

  const candidateUrls = [
    contactLink ? new URL(contactLink, baseUrl).href : null,
    new URL('/contact-us/', baseUrl).href,
    new URL('/contact/', baseUrl).href,
    new URL('/contact-us', baseUrl).href,
    new URL('/contact', baseUrl).href,
  ].filter((url): url is string => Boolean(url));

  await blockCaptchaFunctions(page);

  let contactPageFound = false;
  for (const url of [...new Set(candidateUrls)]) {
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      if (!response?.ok()) continue;

      await waitForPageLoad(page, { loadTimeout: 5000, networkIdleTimeout: 3000 });
      if (await page.locator('form').count()) {
        contactPageFound = true;
        console.log(`[contactUs] Using discovered Contact Us page: ${page.url()}`);
        break;
      }
    } catch {
      // Try the next common Contact Us route.
    }
  }

  if (!contactPageFound) {
    console.warn(`[contactUs] No Contact Us form found for ${specKey}.`);
    return { status: 'FAIL', screenshotPath: null, reason: 'No Contact Us form was found on the site.' };
  }

  const fillFirstVisible = async (selectors: string[], value: string): Promise<boolean> => {
    for (const selector of selectors) {
      const field = page.locator(selector).first();
      if (await field.isVisible().catch(() => false)) {
        await field.fill(value);
        return true;
      }
    }
    return false;
  };

  const hasName = await fillFirstVisible([
    'form input[autocomplete="name"]',
    'form input[name*="name" i]',
    'form input[id*="name" i]',
    'form input[placeholder*="name" i]',
    'form input[type="text"]',
  ], 'Rupesh Kumar');
  const hasEmail = await fillFirstVisible([
    'form input[type="email"]',
    'form input[name*="email" i]',
    'form input[id*="email" i]',
    'form input[placeholder*="email" i]',
  ], 'dm443790@gmail.com');
  await fillFirstVisible([
    'form input[type="tel"]',
    'form input[name*="phone" i]',
    'form input[id*="phone" i]',
    'form input[placeholder*="phone" i]',
  ], '1234 567 890');
  const hasMessage = await fillFirstVisible([
    'form textarea[name*="message" i]',
    'form textarea[id*="message" i]',
    'form textarea[placeholder*="message" i]',
    'form textarea',
  ], 'Automated test message.');

  if (!hasName || !hasEmail || !hasMessage) {
    const screenshotPath = await captureScreenshot(page, `contact-us-${specKey}-form-unrecognized`);
    console.warn(`[contactUs] Required contact fields were not recognized for ${specKey}.`);
    return { status: 'FAIL', screenshotPath, reason: 'The contact form name, email, or message fields were not recognized.' };
  }

  if (await detectCaptcha(page)) {
    const screenshotPath = await captureScreenshot(page, `contact-us-${specKey}-captcha`);
    return { status: 'CAPTCHA_BLOCKED', screenshotPath, reason: 'A CAPTCHA is blocking automatic submission.' };
  }

  const submitButton = page.getByRole('button', { name: /submit|send/i }).first();
  const submitInput = page.locator('form input[type="submit"]').first();
  if (await submitButton.isVisible().catch(() => false)) {
    await submitButton.click();
  } else if (await submitInput.isVisible().catch(() => false)) {
    await submitInput.click();
  } else {
    const screenshotPath = await captureScreenshot(page, `contact-us-${specKey}-submit-not-found`);
    return { status: 'FAIL', screenshotPath, reason: 'No visible Submit or Send button was found.' };
  }

  const successMessage = page.getByText(/thank you|success|message.*sent|received/i).first();
  const success = await successMessage.isVisible({ timeout: 10000 }).catch(() => false);
  const screenshotPath = await captureScreenshot(page, `contact-us-${specKey}${success ? '-success' : '-result'}`);
  const reason = success
    ? undefined
    : await getVisibleContactFormError(page).catch(() => '') || 'Submit was clicked, but no success confirmation appeared within 10 seconds.';
  return { status: success ? 'PASS' : 'FAIL', screenshotPath, reason };
}

/**
 * Detect if a CAPTCHA (visual puzzle, reCAPTCHA, hCaptcha, etc.) is present on the page.
 * Returns true if any known CAPTCHA element is visible.
 */
async function detectCaptcha(page: Page): Promise<boolean> {
  try {
    // Common CAPTCHA selectors:
    // - Visual puzzle CAPTCHAs (image grid)
    // - reCAPTCHA iframe
    // - hCaptcha iframe
    // - Generic CAPTCHA containers
    const captchaSelectors = [
      // Visual puzzle CAPTCHAs (image selection grids)
      'div[class*="captcha"]',
      'div[class*="puzzle"]',
      'div[class*="challenge"]',
      'div[class*="verify"]',
      'div[class*="verification"]',
      // reCAPTCHA
      'iframe[src*="recaptcha"]',
      'iframe[src*="google.com/recaptcha"]',
      'div.g-recaptcha',
      // hCaptcha
      'iframe[src*="hcaptcha"]',
      'div.h-captcha',
      // Generic
      'div[class*="captcha-container"]',
      'div[id*="captcha"]',
      'div[id*="puzzle"]',
    ];

    for (const selector of captchaSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
    }

    // Also check for common CAPTCHA text patterns
    const captchaTextPatterns = [
      'Select all',
      'Click verify',
      'I am not a robot',
      'Verify you are human',
      'Complete the puzzle',
      'Solve the CAPTCHA',
    ];

    for (const text of captchaTextPatterns) {
      const el = page.getByText(text, { exact: false }).first();
      if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
        return true;
      }
    }

    return false;
  } catch {
    // If detection fails, assume no CAPTCHA
    return false;
  }
}

/**
 * Submit the Contact Us form for the site matching the given spec key.
 *
 * Best-effort: any failure is logged but never thrown, so it does not affect
 * the passing script's result.
 *
 * Returns a ContactUsResult with status ('PASS' | 'FAIL' | 'SKIPPED') and
 * optional screenshotPath for reporting.
 */
export async function submitContactUsForm(page: Page, specKey: string): Promise<ContactUsResult> {
  const site = CONTACT_US_SITES.find((s) => s.specKey === specKey);
  if (!site) {
    console.log(`[contactUs] No site-specific config for "${specKey}"; trying a generic Contact Us form.`);
    try {
      return await fillAndSubmitGenericContactForm(page, specKey);
    } catch (err: any) {
      console.warn(`[contactUs] Generic submission failed for ${specKey} (ignored):`, err?.message || err);
      return { status: 'FAIL', screenshotPath: null, reason: err?.message || 'Generic Contact Us submission failed.' };
    }
  }

  try {
    return await fillAndSubmit(page, site);
  } catch (err: any) {
    // Best-effort: never fail the passing script because of this step.
    console.warn(`[contactUs] ${site.name} submission failed (ignored):`, err?.message || err);
    return { status: 'FAIL', screenshotPath: null, reason: err?.message || 'Contact Us submission failed.' };
  }
}

/**
 * recaptchaAudio.ts
 *
 * Handles the Google reCAPTCHA **audio** challenge end-to-end:
 *
 *   1. Detects when the reCAPTCHA dialog (#rc-imageselect) appears.
 *   2. Clicks the "Get an audio challenge" button (#recaptcha-audio-button).
 *   3. Clicks the PLAY button (.rc-audiochallenge-play-button button).
 *   4. Captures the audio file from the network (intercepted from the
 *      Google audio payload URL) and transcribes it with a speech-to-text
 *      backend.
 *   5. Fills the transcribed text into #audio-response.
 *   6. Clicks the Verify button (#recaptcha-verify-button).
 *   7. Waits 5 seconds for the result.
 *
 * Transcription backend selection (first match wins):
 *   1. **Local Whisper (default, no API key needed)** — runs the bundled
 *      `whisper_transcribe.py` via Python. Requires `python` and `ffmpeg`
 *      on PATH and the `openai-whisper` package installed
 *      (`python -m pip install openai-whisper`).
 *   2. **OpenAI Whisper API** — used when `OPENAI_API_KEY` is set.
 *   3. **Custom STT endpoint** — used when `STT_ENDPOINT` is set
 *      (optional `STT_API_KEY` Bearer token).
 *
 * To force a specific backend, set `RECAPTCHA_STT_BACKEND` to
 * `local`, `openai`, or `custom`.
 */

import { Page, Locator } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';

// ─── Selectors ───

const RECAPTCHA_DIALOG = '#rc-imageselect';
const AUDIO_BUTTON = '#recaptcha-audio-button';
const PLAY_BUTTON = '.rc-audiochallenge-play-button button';
const AUDIO_RESPONSE = '#audio-response';
const VERIFY_BUTTON = '#recaptcha-verify-button';

// ─── Config ───

const DEFAULTS = {
  /** How long to wait for the reCAPTCHA dialog to appear (ms) */
  dialogTimeout: 30_000,
  /** How long to wait for the audio challenge UI after clicking audio (ms) */
  audioUiTimeout: 15_000,
  /** How long to wait for the audio network request (ms) */
  audioRequestTimeout: 20_000,
  /** How long to wait after clicking Verify (ms) */
  verifyWait: 5_000,
  /** Max number of attempts (reCAPTCHA may serve a new challenge on failure) */
  maxAttempts: 3,
};

export interface RecaptchaAudioOptions {
  dialogTimeout?: number;
  audioUiTimeout?: number;
  audioRequestTimeout?: number;
  verifyWait?: number;
  maxAttempts?: number;
}

// ─── Audio capture ───

/**
 * Capture the reCAPTCHA audio file by intercepting the network request
 * that serves the audio payload. Returns the file path of the saved
 * audio (mp3) on disk.
 */
async function captureAudioFile(
  page: Page,
  timeout: number
): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recaptcha-audio-'));
  const audioPath = path.join(tmpDir, 'recaptcha-audio.mp3');

  // The reCAPTCHA audio is served from a Google URL containing
  // "recaptcha/api2/audio" or similar. We intercept any response whose
  // content-type is audio/* or whose URL contains "audio".
  const audioResponsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      return (
        contentType.startsWith('audio/') ||
        url.includes('/audio') ||
        url.includes('recaptcha/api2/audio')
      );
    },
    { timeout }
  );

  // Trigger the audio playback by clicking PLAY.
  const playButton = page.locator(PLAY_BUTTON);
  await playButton.waitFor({ state: 'visible', timeout: DEFAULTS.audioUiTimeout });
  await playButton.click();

  const response = await audioResponsePromise;
  const body = await response.body();

  if (!body || body.length === 0) {
    throw new Error('Captured audio response was empty.');
  }

  fs.writeFileSync(audioPath, body);
  return audioPath;
}

// ─── Transcription ───

/**
 * Transcribe an audio file to text.
 *
 * Backend selection (first match wins, overridable via RECAPTCHA_STT_BACKEND):
 *   1. local  → bundled Python Whisper (default; no API key needed)
 *   2. openai → OpenAI Whisper API (requires OPENAI_API_KEY)
 *   3. custom → custom STT endpoint (requires STT_ENDPOINT)
 */
async function transcribeAudio(audioPath: string): Promise<string> {
  const forced = (process.env.RECAPTCHA_STT_BACKEND || '').toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY;
  const sttEndpoint = process.env.STT_ENDPOINT;

  // Determine which backend to use.
  let backend: 'local' | 'openai' | 'custom';
  if (forced === 'openai' || forced === 'custom' || forced === 'local') {
    backend = forced;
  } else if (openaiKey) {
    backend = 'openai';
  } else if (sttEndpoint) {
    backend = 'custom';
  } else {
    backend = 'local';
  }

  switch (backend) {
    case 'openai': {
      if (!openaiKey) {
        throw new Error(
          'RECAPTCHA_STT_BACKEND=openai but OPENAI_API_KEY is not set.'
        );
      }
      return transcribeWithOpenAI(audioPath, openaiKey);
    }
    case 'custom': {
      if (!sttEndpoint) {
        throw new Error(
          'RECAPTCHA_STT_BACKEND=custom but STT_ENDPOINT is not set.'
        );
      }
      return transcribeWithCustomEndpoint(audioPath, sttEndpoint);
    }
    case 'local':
    default:
      return transcribeWithLocalWhisper(audioPath);
  }
}

/**
 * Locate the bundled whisper_transcribe.py script.
 */
function getWhisperScriptPath(): string {
  return path.join(__dirname, 'whisper_transcribe.py');
}

/**
 * Find a usable Python executable.
 */
function getPythonExecutable(): string {
  // Prefer an explicit override, then common names.
  const candidates = [
    process.env.PYTHON_EXECUTABLE,
    'python',
    'python3',
  ].filter(Boolean) as string[];

  return candidates[0] || 'python';
}

/**
 * Transcribe using the local Whisper model via the bundled Python script.
 *
 * Requires:
 *   - `python` on PATH
 *   - `ffmpeg` on PATH
 *   - `openai-whisper` installed (`python -m pip install openai-whisper`)
 */
function transcribeWithLocalWhisper(audioPath: string): Promise<string> {
  const script = getWhisperScriptPath();
  if (!fs.existsSync(script)) {
    return Promise.reject(
      new Error(
        `Local Whisper script not found at ${script}. ` +
        'Ensure utils/captcha/whisper_transcribe.py exists.'
      )
    );
  }

  const python = getPythonExecutable();
  const model = process.env.WHISPER_MODEL || 'base';

  console.log(
    `[recaptchaAudio] Transcribing with local Whisper (model: ${model})...`
  );

  return new Promise<string>((resolve, reject) => {
    execFile(
      python,
      [script, audioPath, model],
      {
        // Whisper model loading + inference can take a while on first run
        // (model download) and on CPU. Give it generous headroom.
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        // On Windows, avoid a console window flashing.
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr?.trim() || error.message;
          reject(
            new Error(
              `Local Whisper transcription failed: ${detail}\n` +
                'Make sure ffmpeg is on PATH and openai-whisper is installed ' +
                '(`python -m pip install openai-whisper`).'
            )
          );
          return;
        }

        const text = (stdout || '').trim();
        if (!text) {
          reject(new Error('Local Whisper returned an empty transcription.'));
          return;
        }

        resolve(normalizeTranscription(text));
      }
    );
  });
}

/**
 * Transcribe using the OpenAI Whisper API.
 */
async function transcribeWithOpenAI(
  audioPath: string,
  apiKey: string
): Promise<string> {
  const model = process.env.OPENAI_WHISPER_MODEL || 'whisper-1';
  const endpoint = 'https://api.openai.com/v1/audio/transcriptions';

  const audioBuffer = fs.readFileSync(audioPath);

  // Build a multipart/form-data request manually to avoid extra deps.
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const fields: Array<{ name: string; value: string }> = [
    { name: 'model', value: model },
    { name: 'language', value: 'en' },
  ];

  const bodyParts: Buffer[] = [];
  for (const field of fields) {
    bodyParts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${field.name}"\r\n\r\n` +
          `${field.value}\r\n`
      )
    );
  }

  // Audio file part
  const fileName = path.basename(audioPath);
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: audio/mpeg\r\n\r\n`
    )
  );
  bodyParts.push(audioBuffer);
  bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(bodyParts);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `OpenAI Whisper API error (${response.status}): ${text}`
    );
  }

  const data = (await response.json()) as { text?: string };
  const text = (data.text || '').trim();

  if (!text) {
    throw new Error('OpenAI Whisper returned empty transcription.');
  }

  return normalizeTranscription(text);
}

/**
 * Transcribe using a custom STT endpoint.
 * Expects a POST multipart request with the audio under field "file"
 * and a JSON response with a "text" field (or plain text body).
 */
async function transcribeWithCustomEndpoint(
  audioPath: string,
  endpoint: string
): Promise<string> {
  const apiKey = process.env.STT_API_KEY;
  const audioBuffer = fs.readFileSync(audioPath);

  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const fileName = path.basename(audioPath);

  const bodyParts: Buffer[] = [];
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: audio/mpeg\r\n\r\n`
    )
  );
  bodyParts.push(audioBuffer);
  bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(bodyParts);

  const headers: Record<string, string> = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Custom STT endpoint error (${response.status}): ${text}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let text: string;

  if (contentType.includes('application/json')) {
    const data = (await response.json()) as { text?: string; transcript?: string };
    text = (data.text || data.transcript || '').trim();
  } else {
    text = (await response.text()).trim();
  }

  if (!text) {
    throw new Error('Custom STT endpoint returned empty transcription.');
  }

  return normalizeTranscription(text);
}

/**
 * Normalize a transcription into the format reCAPTCHA expects:
 * lowercase, no spaces, no punctuation.
 */
function normalizeTranscription(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// ─── Main helper ───

/**
 * Handle the Google reCAPTCHA audio challenge.
 *
 * @param page - The Playwright page where the reCAPTCHA is displayed.
 * @param options - Optional overrides for timeouts and retry count.
 * @returns true if the reCAPTCHA was solved successfully, false otherwise.
 */
export async function solveRecaptchaAudio(
  page: Page,
  options: RecaptchaAudioOptions = {}
): Promise<boolean> {
  const config = { ...DEFAULTS, ...options };

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(
        `[recaptchaAudio] Attempt ${attempt}/${config.maxAttempts}: waiting for reCAPTCHA dialog...`
      );

      // 1. Wait for the reCAPTCHA dialog to appear.
      const dialog = page.locator(RECAPTCHA_DIALOG);
      await dialog.waitFor({ state: 'visible', timeout: config.dialogTimeout });
      console.log('[recaptchaAudio] reCAPTCHA dialog detected.');

      // 2. Click the audio challenge button.
      const audioButton = page.locator(AUDIO_BUTTON);
      await audioButton.waitFor({ state: 'visible', timeout: config.audioUiTimeout });
      await audioButton.click();
      console.log('[recaptchaAudio] Clicked audio challenge button.');

      // 3. Wait for the audio challenge UI to appear, then capture + transcribe.
      const audioPath = await captureAudioFile(
        page,
        config.audioRequestTimeout
      );
      console.log(`[recaptchaAudio] Captured audio: ${audioPath}`);

      const transcription = await transcribeAudio(audioPath);
      console.log(`[recaptchaAudio] Transcription: "${transcription}"`);

      // 4. Fill the response field.
      const responseField = page.locator(AUDIO_RESPONSE);
      await responseField.waitFor({ state: 'visible', timeout: config.audioUiTimeout });
      await responseField.fill(transcription);
      console.log('[recaptchaAudio] Filled audio response.');

      // 5. Click Verify.
      const verifyButton = page.locator(VERIFY_BUTTON);
      await verifyButton.waitFor({ state: 'visible', timeout: config.audioUiTimeout });
      await verifyButton.click();
      console.log('[recaptchaAudio] Clicked Verify.');

      // 6. Wait for the result.
      await page.waitForTimeout(config.verifyWait);

      // 7. Check if the reCAPTCHA was solved (dialog should be gone
      //    or the response field should be hidden).
      const stillVisible = await dialog.isVisible().catch(() => false);
      if (!stillVisible) {
        console.log('[recaptchaAudio] reCAPTCHA solved successfully.');
        cleanupAudioFile(audioPath);
        return true;
      }

      // If the dialog is still visible, reCAPTCHA may have shown an error
      // and served a new challenge. Clean up and retry.
      console.log('[recaptchaAudio] reCAPTCHA still visible, retrying...');
      cleanupAudioFile(audioPath);
    } catch (error) {
      console.error(
        `[recaptchaAudio] Attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error
      );
      if (attempt === config.maxAttempts) {
        throw error;
      }
      // Wait a moment before retrying.
      await page.waitForTimeout(2000);
    }
  }

  return false;
}

/**
 * Clean up the temporary audio file.
 */
function cleanupAudioFile(audioPath: string): void {
  try {
    const dir = path.dirname(audioPath);
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; ignore errors.
  }
}

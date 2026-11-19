#!/usr/bin/env python3
"""
whisper_transcribe.py

Local speech-to-text helper for the reCAPTCHA audio challenge.

Usage:
    python whisper_transcribe.py <audio_file_path> [model_name]

Arguments:
    audio_file_path : Path to the audio file (mp3/wav/etc.)
    model_name      : Optional Whisper model size. One of:
                        tiny, base, small, medium, large
                      Defaults to "base" (good balance of speed/accuracy
                      for short reCAPTCHA clips).

Output:
    Prints the transcribed text (single line, no trailing newline) to stdout.
    Exits non-zero and prints an error to stderr on failure.

This script is intentionally dependency-light: it only needs
`openai-whisper` (which pulls in torch) and ffmpeg on PATH.
"""

import sys
import os


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python whisper_transcribe.py <audio_file> [model]", file=sys.stderr)
        return 2

    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "base"

    if not os.path.isfile(audio_path):
        print(f"Audio file not found: {audio_path}", file=sys.stderr)
        return 1

    try:
        import whisper
    except ImportError as exc:
        print(f"Failed to import whisper: {exc}", file=sys.stderr)
        print("Install it with: python -m pip install openai-whisper", file=sys.stderr)
        return 1

    try:
        # Load the model (cached after first download).
        model = whisper.load_model(model_name)

        # Transcribe. reCAPTCHA audio is English and short.
        result = model.transcribe(
            audio_path,
            language="en",
            fp16=False,  # CPU build; fp16 is GPU-only and would warn on CPU.
        )

        text = (result.get("text") or "").strip()
        # Print without trailing newline so the caller can read it cleanly.
        sys.stdout.write(text)
        return 0

    except Exception as exc:  # noqa: BLE001 - report any failure to the caller
        print(f"Transcription failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

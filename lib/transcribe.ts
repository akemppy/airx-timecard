/**
 * Transcribe module - now using Web Speech API on the client side.
 * This file is kept for compatibility but is no longer needed.
 * All transcription now happens via the browser's Web Speech API.
 */

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  throw new Error("Audio transcription is now handled client-side via Web Speech API. This function should not be called.");
}

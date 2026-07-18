import { logger } from './logger';

export interface SpeechTranscriber {
  transcribe(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{
    transcript: string;
    confidence?: number;
    durationMs?: number;
    provider: string;
    modelUsed: string;
  }>;
}

const openAiApiKey = process.env.OPENAI_API_KEY || '';
const transcriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1';
const transcriptionTimeout = Number(process.env.OPENAI_TRANSCRIPTION_TIMEOUT_MS || '30000');
const maxSttAttempts = Number(process.env.OPENAI_TRANSCRIPTION_MAX_ATTEMPTS || '3');

export class WhisperTranscriber implements SpeechTranscriber {
  async transcribe(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{
    transcript: string;
    confidence?: number;
    durationMs?: number;
    provider: string;
    modelUsed: string;
  }> {
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    let attempt = 0;
    while (attempt < maxSttAttempts) {
      attempt++;
      try {
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: mimeType });
        formData.append('file', blob, fileName);
        formData.append('model', transcriptionModel);

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), transcriptionTimeout);

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(id);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI Whisper API responded with ${response.status}: ${errText}`);
        }

        const data: any = await response.json();
        return {
          transcript: data.text || '',
          confidence: undefined, // Whisper API does not return a single global confidence parameter
          durationMs: data.duration ? Math.round(data.duration * 1000) : undefined,
          provider: 'OpenAI Whisper',
          modelUsed: transcriptionModel,
        };
      } catch (err: any) {
        logger.warn(`Whisper transcription attempt ${attempt}/${maxSttAttempts} failed: ${err.message}`);
        if (attempt >= maxSttAttempts) {
          throw err;
        }
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.min(5000, 1000 * Math.pow(2, attempt))));
      }
    }
    throw new Error('STT transcription failed after all attempts.');
  }
}

export class FakeTranscriber implements SpeechTranscriber {
  async transcribe(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{
    transcript: string;
    confidence?: number;
    durationMs?: number;
    provider: string;
    modelUsed: string;
  }> {
    // Return a deterministic transcript for tests
    return {
      transcript: 'The continuous expansion of cloud infrastructures has revolutionized data redundancy strategies.',
      confidence: 0.98,
      durationMs: 4500,
      provider: 'Deterministic Mock STT',
      modelUsed: 'mock-whisper-1',
    };
  }
}

export function getTranscriber(): SpeechTranscriber {
  if (process.env.NODE_ENV === 'production' || (openAiApiKey && !process.env.FORCED_MOCK_STT)) {
    return new WhisperTranscriber();
  }
  return new FakeTranscriber();
}

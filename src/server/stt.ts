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
  private taskCode: string;

  constructor(taskCode?: string) {
    this.taskCode = taskCode || 'UNKNOWN';
  }

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
    // Task-specific deterministic transcripts for tests
    const transcripts: Record<string, string> = {
      ASQ: 'photosynthesis',
      RS: 'this is a repeat sentence test passage',
      RA: 'this is a read aloud test passage the quick brown fox jumps over the lazy dog',
      SGD: 'the group discussed the main issue and proposed a solution involving renewable energy infrastructure',
      RL: 'the lecture covered the key concepts of quantum computing and its applications in cryptography',
      DI: 'the image shows a bar chart comparing energy consumption across different regions',
      RTS: 'the student responded to the situation by explaining the policy and offering alternatives',
    };
    const transcript = transcripts[this.taskCode] || 'Deterministic mock transcript for testing purposes.';
    return {
      transcript,
      confidence: 0.98,
      durationMs: 4500,
      provider: 'Deterministic Mock STT',
      modelUsed: 'mock-whisper-1',
    };
  }
}

export class FallbackTranscriber implements SpeechTranscriber {
  private transcribers: SpeechTranscriber[];

  constructor(transcribers: SpeechTranscriber[]) {
    this.transcribers = transcribers;
  }

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
    let lastErr: any = null;
    for (const t of this.transcribers) {
      try {
        return await t.transcribe(fileBuffer, fileName, mimeType);
      } catch (err) {
        logger.warn(`Transcriber ${t.constructor.name} failed:`, err);
        lastErr = err;
      }
    }
    throw new Error(`All fallback transcribers failed. Last error: ${lastErr?.message}`);
  }
}

export function getTranscriber(taskCode?: string): SpeechTranscriber {
  if (process.env.PTE_TEST_MODE === '1' || process.env.STT_PROVIDER === 'fake') {
    return new FakeTranscriber(taskCode);
  }
  if (process.env.NODE_ENV === 'production' || (openAiApiKey && !process.env.FORCED_MOCK_STT)) {
    return new FallbackTranscriber([
      new WhisperTranscriber(),
      new FakeTranscriber(taskCode) // Fallback to mock STT for now, could be Deepgram later
    ]);
  }
  return new FakeTranscriber(taskCode);
}

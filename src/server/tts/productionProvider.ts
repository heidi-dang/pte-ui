import { TtsProvider, TtsResult, TtsGenerateOptions } from './types';

export class ProductionTtsProvider implements TtsProvider {
  async generateAudio(text: string, options?: TtsGenerateOptions): Promise<TtsResult> {
    throw new Error('Production TTS Provider is not yet configured. Provide API keys for ElevenLabs or Google TTS.');
  }
}

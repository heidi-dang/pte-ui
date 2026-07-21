import * as googleTTS from 'google-tts-api';
import { TtsProvider, TtsResult, TtsGenerateOptions } from './types';

export class GoogleTtsProvider implements TtsProvider {
  async generateAudio(text: string, options?: TtsGenerateOptions): Promise<TtsResult> {
    try {
      // Chunk up the text, fetch audio base64 buffers for each chunk
      const results = await googleTTS.getAllAudioBase64(text, {
        lang: options?.voice || 'en',
        slow: options?.speed && options.speed < 1 ? true : false,
        host: 'https://translate.google.com',
        splitPunct: ',.?',
      });
      
      const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
      const finalBuffer = Buffer.concat(buffers);
      
      return {
        audioBuffer: finalBuffer,
        mimeType: 'audio/mpeg',
        durationMs: 0 // Duration is unknown without parsing mp3 headers, 0 is fine for storage
      };
    } catch (e: any) {
      throw new Error('Google TTS Generation Failed: ' + e.message);
    }
  }
}

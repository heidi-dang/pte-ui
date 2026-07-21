import { TtsProvider } from './types';
import { GoogleTtsProvider } from './googleProvider';
import { ProductionTtsProvider } from './productionProvider';

export function getTtsProvider(): TtsProvider {
  // Use Google provider (free) in dev or if no TTS API key is configured
  if (process.env.NODE_ENV === 'production' && process.env.TTS_API_KEY) {
    return new ProductionTtsProvider();
  }
  return new GoogleTtsProvider();
}

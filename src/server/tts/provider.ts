import { TtsProvider } from './types';
import { FakeTtsProvider } from './fake';
import { ProductionTtsProvider } from './productionProvider';

export function getTtsProvider(): TtsProvider {
  // Use fake provider in dev unless specifically configured
  if (process.env.NODE_ENV === 'production' && process.env.TTS_API_KEY) {
    return new ProductionTtsProvider();
  }
  return new FakeTtsProvider();
}

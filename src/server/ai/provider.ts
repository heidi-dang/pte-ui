import { AiProvider } from './types';
import { DeepSeekProvider } from './deepseek';
import { FakeProvider } from './fake';
import { logger } from '../logger';

let centralProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (centralProvider) {
    return centralProvider;
  }

  const selectedProvider = process.env.AI_PROVIDER || 'fake';
  logger.info(`Initializing central AI provider: ${selectedProvider}`);

  if (selectedProvider === 'deepseek') {
    centralProvider = new DeepSeekProvider();
  } else if (selectedProvider === 'fake') {
    centralProvider = new FakeProvider();
  } else {
    throw new Error(`Unsupported AI_PROVIDER configuration: "${selectedProvider}". Must be 'deepseek' or 'fake'.`);
  }

  return centralProvider;
}

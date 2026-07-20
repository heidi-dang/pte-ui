import { AiProvider } from './types';
import { DeepSeekProvider } from './deepseek';
import { FakeProvider } from './fake';
import { logger } from '../logger';

let centralProvider: AiProvider | null = null;

function validateConfig(provider: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && provider === 'fake') {
    throw new Error(
      'AI_PROVIDER is set to "fake" in production mode. Production requires "deepseek" with a valid DEEPSEEK_API_KEY. '
      + 'Set AI_PROVIDER=deepseek and DEEPSEEK_API_KEY in your environment.'
    );
  }
  if (provider === 'deepseek') {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key.length < 8) {
      throw new Error(
        'DEEPSEEK_API_KEY is missing or invalid. Set DEEPSEEK_API_KEY in your environment when AI_PROVIDER=deepseek.'
      );
    }
  }
}

export function getAiProvider(): AiProvider {
  if (centralProvider) {
    return centralProvider;
  }

  const selectedProvider = process.env.AI_PROVIDER || 'fake';
  validateConfig(selectedProvider);
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

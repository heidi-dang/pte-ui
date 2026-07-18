function requireEnv(name: string): string {
  const value = process.env[name];
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const jwtSecret = isProduction
  ? requireEnv('JWT_SECRET')
  : (process.env.JWT_SECRET || 'pte-ui-dev-test-jwt-secret');

const demoMode = isProduction
  ? process.env.DEMO_MODE === 'true'
  : process.env.DEMO_MODE !== 'false';

const seedOnStartup = (isProduction || isTest)
  ? process.env.SEED_ON_STARTUP === 'true'
  : process.env.SEED_ON_STARTUP !== 'false';

const aiProvider = process.env.AI_PROVIDER || 'fake';
const deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';

if (aiProvider === 'deepseek' && !deepseekApiKey) {
  throw new Error('DEEPSEEK_API_KEY environment variable is required when AI_PROVIDER is set to deepseek');
}

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 3000),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  demoMode,
  seedOnStartup,
  jwtSecret,
  aiProvider,
  deepseekApiKey,
};

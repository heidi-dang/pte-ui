function requireEnv(name: string): string {
  const value = process.env[name];
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const jwtSecret = requireEnv('JWT_SECRET');

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 3000),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  demoMode: process.env.DEMO_MODE !== 'false',
  seedOnStartup: process.env.SEED_ON_STARTUP !== 'false',
  jwtSecret,
};

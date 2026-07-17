import { createApp } from './src/server/app';
import { config } from './src/server/config';
import { logger } from './src/server/logger';

async function main() {
  const app = await createApp();

  app.listen(config.port, '0.0.0.0', () => {
    logger.info(`Server running on port ${config.port} (${config.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

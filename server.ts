import { createApp } from './src/server/app';
import { config } from './src/server/config';
import { logger } from './src/server/logger';

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — preventing process death:', err);
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION — preventing process death:', reason);
});

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

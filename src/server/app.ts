import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { config } from './config';
import { runSeeding } from './seed';
import { setupUploads, getUploadsDir } from './uploads';
import { mountRoutes } from './routes/index';
import { startJobProcessor } from './jobs/worker';
import { logger } from './logger';

export async function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Run database seeding on start (controlled by SEED_ON_STARTUP)
  if (config.seedOnStartup) {
    try {
      await runSeeding();
      logger.info('Database seeding completed successfully on startup.');
    } catch (err: any) {
      logger.error('Startup seeding failed', { error: err.message });
    }
  }

  // Static serving for uploads
  app.use('/uploads', express.static(getUploadsDir()));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Upload route
  app.use('/api', setupUploads());

  // Database seeding helper (demo mode only)
  app.post('/api/seed', async (req, res) => {
    if (!config.demoMode) {
      res.status(403).json({ error: 'Seeding is only available in demo mode' });
      return;
    }
    try {
      await runSeeding();
      res.json({ success: true, message: 'Database seeded with demo student, teacher, and admin accounts successfully!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to seed database: ' + err.message });
    }
  });

  // Mount API routes
  app.use('/api', mountRoutes());

  // Start background job loop
  if (config.nodeEnv !== 'test') {
    startJobProcessor();
  }

  // Vite / static frontend
  if (!config.isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

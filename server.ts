import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './src/server/auth';
import { studentRouter } from './src/server/student';
import { teacherRouter } from './src/server/teacher';
import { adminRouter } from './src/server/admin';
import { startJobProcessor } from './src/server/jobs';
import { prisma } from './src/server/db';
import bcrypt from 'bcryptjs';
import { logger } from './src/server/logger';

async function runSeeding() {
  // 1. Create Default Users if they don't exist
  const defaultUsers = [
    { email: 'student@example.com', name: 'Alex Mercer', role: 'student', password: 'password123', targetScore: 79, currentAvg: 74 },
    { email: 'teacher@example.com', name: 'Dr. Evelyn Carter', role: 'teacher', password: 'password123', targetScore: 90, currentAvg: 0 },
    { email: 'admin@example.com', name: 'Platform Admin', role: 'admin', password: 'password123', targetScore: 90, currentAvg: 0 },
  ];

  for (const u of defaultUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: hashed,
          targetScore: u.targetScore,
          currentAvg: u.currentAvg,
        },
      });
      logger.info(`Seeded user: ${u.email} (${u.role})`);
    }
  }

  // 2. Add some mock submissions for testing
  const student = await prisma.user.findUnique({ where: { email: 'student@example.com' } });
  if (student) {
    const existingSubs = await prisma.practiceSubmission.findMany({ where: { userId: student.id } });
    if (existingSubs.length === 0) {
      await prisma.practiceSubmission.createMany({
        data: [
          {
            userId: student.id,
            taskCode: 'WE',
            title: 'Automation and Employment',
            section: 'Writing',
            answerText: 'In the modern world, the rise of artificial intelligence has created massive controversy regarding jobs...',
            status: 'graded',
            score: 79,
            feedback: 'Excellent structural control. Complex sentences are highly accurate. Try expanding vocabulary range.',
            grammarIssues: 1,
          },
          {
            userId: student.id,
            taskCode: 'RA',
            title: 'The Great Barrier Reef',
            section: 'Speaking',
            answerText: 'The Great Barrier Reef is the world... composed of over two thousand reefs...',
            status: 'pending',
          },
          {
            userId: student.id,
            taskCode: 'SST',
            title: 'Urban Heat Islands',
            section: 'Listening',
            answerText: 'The speaker discussed the urban heat island effect that is happening in cities due to concrete buildings and high air conditioning uses...',
            status: 'graded',
            score: 65,
            feedback: 'Good summary of main themes, but your word count was 42 words, which is under the 50-70 limit.',
            grammarIssues: 2,
          }
        ],
      });

      await prisma.testAttempt.createMany({
        data: [
          {
            userId: student.id,
            testId: 'MT-01',
            title: 'PTE Academic Mini Booster',
            type: 'mini',
            date: '2026-07-12',
            overallScore: 74,
            speakingScore: 78,
            writingScore: 72,
            readingScore: 69,
            listeningScore: 75,
            status: 'Completed',
          },
          {
            userId: student.id,
            testId: 'MT-03',
            title: 'Full Exam Real-Sim #1',
            type: 'full',
            date: '2026-06-28',
            overallScore: 68,
            speakingScore: 62,
            writingScore: 71,
            readingScore: 67,
            listeningScore: 70,
            status: 'Completed',
          }
        ]
      });

      await prisma.notification.create({
        data: {
          userId: student.id,
          title: 'Welcome Back Student!',
          text: 'You have been seeded with sample mock questions, graded practice essays, and a completed full mock exam.',
        }
      });
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Run database seeding on start
  try {
    await runSeeding();
    logger.info('Database seeding completed successfully on startup.');
  } catch (err: any) {
    logger.error('Startup seeding failed', { error: err.message });
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads statically
  app.use('/uploads', express.static(uploadsDir));

  // Configure Multer for local storage uploads (audio recordings / images)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.wav';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });

  const upload = multer({ storage });

  // API - Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // API - Upload route
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // API - Database Seeding Helper
  app.post('/api/seed', async (req, res) => {
    try {
      await runSeeding();
      res.json({ success: true, message: 'Database seeded with demo student, teacher, and admin accounts successfully!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to seed database: ' + err.message });
    }
  });

  // Mount modular routes
  app.use('/api/auth', authRouter);
  app.use('/api/student', studentRouter);
  app.use('/api/teacher', teacherRouter);
  app.use('/api/admin', adminRouter);

  // Start background job loop
  startJobProcessor();

  // Vite Server Integration
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

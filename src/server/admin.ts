import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { authenticateToken, requireRole } from './auth';
import { logger } from './logger';

export const adminRouter = Router();

// Secure this router to admins only
adminRouter.use(authenticateToken);
adminRouter.use(requireRole(['admin']));

// 1. Get All Users (Students, Teachers, Admins)
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        targetScore: true,
        currentAvg: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve user accounts' });
  }
});

// 2. Update User Role
adminRouter.post('/users/:id/role', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Invalid or missing role' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    logger.info(`Admin changed user role for ${updated.email} to ${role}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// 3. Toggle User Status (Active vs Inactive)
adminRouter.post('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Active', 'Inactive'].includes(status)) {
    res.status(400).json({ error: 'Invalid or missing status' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });

    logger.info(`Admin toggled status for ${updated.email} to ${status}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 4. Get System Logs
adminRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.logEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Last 100 logs
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve system logs' });
  }
});

// 5. Get Background Jobs status
adminRouter.get('/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.backgroundJob.findMany({
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve background jobs' });
  }
});

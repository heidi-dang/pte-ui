import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'pte_academic_mastery_jwt_secret_key_2026';

export const authRouter = Router();

// Express Request type helper
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Authentication Middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: string };
    
    // Optional: verify in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.status === 'Inactive') {
      res.status(403).json({ error: 'User inactive or not found' });
      return;
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Authorization Middleware
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Permission denied for this role' });
      return;
    }
    next();
  };
}

// Signup Endpoint
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, targetScore } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'student',
        targetScore: targetScore ? parseInt(targetScore) : 79,
      },
    });

    // Create a first welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to PTE Academic Mastery!',
        text: 'Kickstart your preparation by trying mock practice questions or checking your learning path!',
      },
    });

    // Automated Welcome Email simulation logged in AuditLogs
    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_SENT',
        category: 'Email',
        message: `Automated Email: Welcome onboarding kit transmitted to ${user.email}.`,
        metadata: JSON.stringify({
          subject: 'Unlock Your PTE Potential - Welcome to PTE Academic Master! 🌟',
          recipient: user.name,
        }),
      },
    });

    logger.info(`User registered successfully: ${email} (${user.role})`);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        targetScore: user.targetScore,
        currentAvg: user.currentAvg,
        subTier: user.subTier,
        couponApplied: user.couponApplied,
        subExpiresAt: user.subExpiresAt,
      },
    });
  } catch (err: any) {
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Login Endpoint
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'Inactive') {
      res.status(403).json({ error: 'This account has been deactivated' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`User logged in successfully: ${email}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        targetScore: user.targetScore,
        currentAvg: user.currentAvg,
        subTier: user.subTier,
        couponApplied: user.couponApplied,
        subExpiresAt: user.subExpiresAt,
      },
    });
  } catch (err: any) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current Logged In User details
authRouter.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const reqUser = (req as any).user;
  try {
    const user = await prisma.user.findUnique({
      where: { id: reqUser.id },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      targetScore: user.targetScore,
      currentAvg: user.currentAvg,
      subTier: user.subTier,
      couponApplied: user.couponApplied,
      subExpiresAt: user.subExpiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

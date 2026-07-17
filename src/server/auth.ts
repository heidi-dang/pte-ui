import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './db';
import { logger } from './logger';
import { config } from './config';

const JWT_SECRET = config.jwtSecret;
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

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

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
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

// Signup Endpoint — public users can only create student accounts
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, targetScore } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  // Public signup cannot create admin or teacher accounts
  const safeRole = 'student';
  if (role && !['student'].includes(role)) {
    res.status(400).json({ error: 'Only student accounts can be created through public registration' });
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
        role: safeRole,
        targetScore: targetScore ? parseInt(targetScore) : 79,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to PTE Academic Mastery!',
        text: 'Kickstart your preparation by trying mock practice questions or checking your learning path!',
      },
    });

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

// Login Endpoint — updates lastLoginAt on success
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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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

// Forgot Password — always returns generic success
authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const genericMessage = 'If an account exists, reset instructions have been prepared.';

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status === 'Inactive') {
      res.json({ message: genericMessage });
      return;
    }

    const resetToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    // Clear any previous reset token and set new one
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // In development/demo mode, return the raw token for testing
    const response: any = { message: genericMessage };
    if (config.demoMode) {
      response.resetToken = resetToken;
      response.resetUrl = `${req.protocol}://${req.hostname}/reset-password?token=${resetToken}`;
    }

    logger.info(`Password reset token generated for ${email} (expires ${expiresAt.toISOString()})`);
    res.json(response);
  } catch (err: any) {
    logger.error('Forgot password error', { error: err.message });
    res.json({ message: genericMessage });
  }
});

// Reset Password — validates token hash and expiry, one-time use
authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const tokenHash = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        status: 'Active',
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordChangedAt: new Date(),
      },
    });

    logger.info(`Password reset successful for ${user.email}`);

    res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (err: any) {
    logger.error('Reset password error', { error: err.message });
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Change Password — requires authentication
authRouter.post('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const reqUser = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: reqUser.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(403).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    logger.info(`Password changed for ${user.email}`);
    res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    logger.error('Change password error', { error: err.message });
    res.status(500).json({ error: 'Failed to change password' });
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

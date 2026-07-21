import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Router } from 'express';
import { config } from './config';
import { authenticateToken } from './auth';
import { uploadRateLimiter } from './rateLimiter';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/webm',
  'video/mp4', 'video/webm',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.wav', '.mp3', '.m4a', '.ogg', '.webm',
  '.mp4',
  '.pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function setupUploads(): Router {
  const router = Router();

  const uploadsDir = path.join(process.cwd(), config.uploadDir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)?.toLowerCase() || '.bin';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname)?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        cb(new Error(`File extension ${ext} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(new Error(`File type ${file.mimetype} is not allowed.`));
        return;
      }
      cb(null, true);
    },
  });

  router.post('/upload', authenticateToken, uploadRateLimiter, upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Additional role-based check
    const user = (req as any).user;
    const userRole = user?.role || 'student';
    if (userRole === 'student' && !['audio/', 'image/'].some(p => req.file!.mimetype.startsWith(p))) {
      res.status(403).json({ error: 'Students can only upload audio and image files.' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  return router;
}

export function getUploadsDir(): string {
  return path.join(process.cwd(), config.uploadDir);
}

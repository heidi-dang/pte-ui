import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { Router } from 'express';
import { config } from './config';
import { authenticateToken } from './auth';
import { uploadRateLimiter } from './rateLimiter';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/webm',
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.wav', '.mp3', '.m4a', '.ogg', '.webm',
];

const DANGEROUS_EXTENSIONS = [
  '.html', '.htm', '.svg', '.xml', '.xhtml',
  '.exe', '.bat', '.cmd', '.com', '.msi',
  '.js', '.jsx', '.ts', '.tsx', '.vue',
  '.php', '.py', '.rb', '.pl', '.sh', '.bash',
  '.jar', '.war', '.class',
  '.docm', '.xlsm', '.pptm',
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
      const ext = path.extname(file.originalname)?.toLowerCase() || '';
      cb(null, crypto.randomUUID() + ext);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname)?.toLowerCase();
      if (!ext || DANGEROUS_EXTENSIONS.includes(ext)) {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        return;
      }
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        return;
      }
      cb(null, true);
    },
  });

  router.post('/upload', authenticateToken, uploadRateLimiter, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
            return;
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            res.status(415).json({ error: 'File type or extension is not allowed.' });
            return;
          }
          res.status(400).json({ error: err.message });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const user = (req as any).user;
      const userRole = user?.role || 'student';
      if (userRole === 'student' && !['audio/', 'image/'].some(p => req.file!.mimetype.startsWith(p))) {
        res.status(403).json({ error: 'Students can only upload audio and image files.' });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    });
  });

  return router;
}

export function getUploadsDir(): string {
  return path.join(process.cwd(), config.uploadDir);
}

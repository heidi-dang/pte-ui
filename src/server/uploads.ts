import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Router } from 'express';
import { config } from './config';
import { authenticateToken } from './auth';

export function setupUploads(): Router {
  const router = Router();
  router.use(authenticateToken);

  const uploadsDir = path.join(process.cwd(), config.uploadDir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

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

  router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
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

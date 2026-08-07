import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AiController } from './ai.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ai-docs');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${hash}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMime = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
    ];

    if (allowedMime.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|txt|md|csv|json)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Supported formats: PDF, DOCX, TXT, MD, CSV, JSON.'), false);
    }
  },
});

const router = Router();

// Protect all AI routes with user authentication
router.use(authMiddleware);

// Ingestion endpoints
router.post('/upload', upload.single('file'), AiController.uploadAndIngest);
router.post('/ingest-text', AiController.ingestRawText);

// Chat & Generation endpoints
router.post('/chat/stream', AiController.chatStream);
router.post('/chat', AiController.chat);
router.post('/summarize', AiController.summarize);
router.post('/document/action', AiController.documentAction);

// Retrieval & Knowledge Base endpoints
router.post('/search', AiController.search);
router.get('/documents', AiController.listUserDocuments);
router.delete('/documents/:documentId', AiController.deleteDocument);

// Course Generator endpoints
import courseGeneratorRoutes from './course.generator.routes.js';
router.use('/course-generator', courseGeneratorRoutes);

export default router;

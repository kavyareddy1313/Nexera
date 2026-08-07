import { Router } from 'express';
import { CourseGeneratorController } from './course.generator.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import multer from 'multer';

// For RAG reference doc upload
const upload = multer({ dest: 'uploads/course-references/' });

const router = Router();

// Protect all course generation routes (Admin / Instructor only)
router.use(authMiddleware);
router.use(requireRole(['admin', 'instructor']));

// 1. Kick off generation pipeline
router.post('/generate', upload.single('referenceDoc'), CourseGeneratorController.generateCourse);

// 2. Poll generation status
router.get('/generate/:jobId', CourseGeneratorController.getJobStatus);

// 3. Retry a failed job
router.post('/generate/:jobId/retry', CourseGeneratorController.retryJob);

// 4. Get generated course draft for review
router.get('/courses/:courseId/draft', CourseGeneratorController.getDraft);

// 5. Update a lesson (content, quiz, video link) during review
router.patch('/courses/:courseId/lessons/:lessonId', CourseGeneratorController.updateLesson);

// 6. Publish the final course
router.post('/courses/:courseId/publish', CourseGeneratorController.publishCourse);

export default router;

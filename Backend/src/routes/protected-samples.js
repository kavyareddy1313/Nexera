import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Test student route
router.get('/student', authMiddleware, requireRole(['student', 'admin']), (req, res) => {
  res.json(ApiResponse.ok({ message: 'Welcome to the Student area!' }));
});

// Test instructor route
router.get('/instructor', authMiddleware, requireRole(['instructor', 'admin']), (req, res) => {
  res.json(ApiResponse.ok({ message: 'Welcome to the Instructor area!' }));
});

// Test admin route
router.get('/admin', authMiddleware, requireRole(['admin']), (req, res) => {
  res.json(ApiResponse.ok({ message: 'Welcome to the Admin area!' }));
});

export default router;

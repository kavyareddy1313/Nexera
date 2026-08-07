import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  res.json(ApiResponse.ok([]));
}));

router.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(ApiResponse.created({}, 'Meeting scheduled'));
}));

export default router;

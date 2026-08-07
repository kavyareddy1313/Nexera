import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { env } from '../../config/env.js';
import crypto from 'crypto';

const router = Router();

router.post('/signature', asyncHandler(async (req, res) => {
  const { folder = 'nexera/media', publicId } = req.body;
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp, ...(publicId && { public_id: publicId }) };
  
  const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha256').update(sortedParams + env.CLOUDINARY_API_SECRET).digest('hex');

  res.json(ApiResponse.ok({ signature, timestamp, cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, folder }));
}));

export default router;

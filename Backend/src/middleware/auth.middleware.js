import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'fullName', 'role']
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    req.user = user;
    req.accessToken = token;
    next();
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
});

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('Forbidden: You do not have permission to access this resource');
    }
    next();
  };
};

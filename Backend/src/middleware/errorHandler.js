import { ApiError } from '../utils/ApiError.js';
import { logger } from './requestLogger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError && err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        code: err.statusCode,
        message: err.message,
        details: err.errors ?? [],
      }
    });
    return;
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  res.status(500).json({
    error: {
      code: 500,
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
    }
  });
};

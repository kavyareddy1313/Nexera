import morgan from 'morgan';
import winston from 'winston';
import { env } from '../config/env.js';

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack }) => {
            return stack
              ? `${timestamp} ${level}: ${message}\n${stack}`
              : `${timestamp} ${level}: ${message}`;
          })
        )
  ),
  transports: [
    new winston.transports.Console(),
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

const morganStream = {
  write: (message) => logger.http(message.trim()),
};

export const requestLogger = morgan(
  env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: morganStream }
);

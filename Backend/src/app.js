import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { env } from './config/env.js';
import { corsConfig } from './config/cors.js';
import { requestLogger, logger } from './middleware/requestLogger.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSocketServer } from './socket/index.js';
import { ApiError } from './utils/ApiError.js';
import { connectDB } from './config/db.js';
import './models/index.js';

import authRoutes from './modules/auth/auth.routes.js';
import chatRoutes from './modules/chat/chat.router.js';
import meetingsRoutes from './modules/meetings/meetings.routes.js';
import whiteboardRoutes from './modules/whiteboard/whiteboard.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import protectedSampleRoutes from './routes/protected-samples.js';
import aiRoutes from './modules/ai/ai.routes.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
  contentSecurityPolicy: false
}));
app.use(cors(corsConfig));
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use(globalRateLimit);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/v1/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok', environment: env.NODE_ENV }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/meetings', meetingsRoutes);
app.use('/api/v1/whiteboard', whiteboardRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/protected', protectedSampleRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use((req, res, next) => next(ApiError.notFound(`Route not found`)));
app.use(errorHandler);

createSocketServer(httpServer);

const PORT = env.PORT;

import { setupCronJobs } from './config/cron.js';
import { autoSeedInstructorsAndCourses } from './config/autoSeed.js';

httpServer.listen(PORT, async () => {
  logger.info(`🚀 Nexera Backend running on port ${PORT} [${env.NODE_ENV}]`);
  await connectDB();
  await autoSeedInstructorsAndCourses();
  setupCronJobs();
});

export { app, httpServer };

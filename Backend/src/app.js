import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import { env } from './config/env.js';
import { corsConfig } from './config/cors.js';
import { requestLogger, logger } from './middleware/requestLogger.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSocketServer } from './socket/index.js';
import { ApiError } from './utils/ApiError.js';
import { connectDB } from './config/db.js';

import authRoutes from './modules/auth/auth.routes.js';
import chatRoutes from './modules/chat/chat.router.js';
import meetingsRoutes from './modules/meetings/meetings.routes.js';
import whiteboardRoutes from './modules/whiteboard/whiteboard.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import protectedSampleRoutes from './routes/protected-samples.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors(corsConfig));
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use(globalRateLimit);

app.get('/health', (req, res) => res.json({ status: 'ok', environment: env.NODE_ENV }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/meetings', meetingsRoutes);
app.use('/api/v1/whiteboard', whiteboardRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/protected', protectedSampleRoutes);

app.use((req, res, next) => next(ApiError.notFound(`Route not found`)));
app.use(errorHandler);

createSocketServer(httpServer);

const PORT = env.PORT;

import { setupCronJobs } from './config/cron.js';

httpServer.listen(PORT, async () => {
  logger.info(`🚀 Nexera Backend running on port ${PORT} [${env.NODE_ENV}]`);
  await connectDB();
  setupCronJobs();
});

export { app, httpServer };

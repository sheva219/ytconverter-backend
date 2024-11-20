import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { convertRouter } from './routes/convert';
import { setupCleanup } from './utils/cleanup';
import logger from './utils/logger';

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per IP
  message: { error: 'Rate limit exceeded', retryAfter: 3600 }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-netlify-app.netlify.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/api/convert', limiter, convertRouter);

// Start cleanup service
setupCleanup();

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`);
});
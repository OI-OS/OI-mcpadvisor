import express from 'express';
import searchRoutes from './routes/search.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Register API routes
router.use('/search', searchRoutes);

// API health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Log API requests
router.use((req, res, next) => {
  logger.info(`API ${req.method} ${req.originalUrl}`);
  next();
});

// API 404 handler
router.use((req, res) => {
  logger.warn(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

export default router;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverRoutes from './routes/serverRoutes.js';
import configRoutes from './routes/configRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import entryRoutes from './routes/entryRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import setupRoutes from './routes/setupRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/setup', setupRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/config', configRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/players', playerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AC Server Manager API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

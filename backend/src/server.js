import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import serverRoutes from './routes/serverRoutes.js';
import configRoutes from './routes/configRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import entryRoutes from './routes/entryRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import setupRoutes from './routes/setupRoutes.js';
import processRoutes from './routes/processRoutes.js';
import updateRoutes from './routes/updateRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.use('/api/process', processRoutes);
app.use('/api/update', updateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
    },
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

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop all running server instances
  try {
    const { stopAllServers } = await import('./services/serverProcessManager.js');
    console.log('Stopping all AC server instances...');
    await stopAllServers();
  } catch (error) {
    console.error('Error stopping AC servers during shutdown:', error);
  }

  // Stop legacy single AC server if running
  try {
    const { getServerStatus, stopServer } = await import('./services/serverService.js');
    const status = await getServerStatus();
    if (status.running) {
      console.log('Stopping legacy AC server...');
      await stopServer();
    }
  } catch (error) {
    console.error('Error stopping legacy AC server during shutdown:', error);
  }

  // Close Express server
  server.close(() => {
    console.log('Express server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 AC Server Manager API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);

  // Reset working config on server start to ensure fresh state
  import('./services/configStateManager.js').then((module) => {
    module.resetWorkingConfig();
    console.log('🔄 Working configuration reset - will load fresh on first request');
  });
});

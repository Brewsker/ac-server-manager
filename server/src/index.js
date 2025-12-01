/**
 * Application Entry Point
 * 
 * Initializes and starts the AC Server Manager application.
 * Sets up the HTTP server and initializes all services.
 * 
 * @module index
 */

const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const { configService, serverService, contentService } = require('./services');

/**
 * Create HTTP server
 * @type {http.Server}
 */
const server = http.createServer(app);

/**
 * Initialize all services
 * 
 * Prepares the application by initializing configuration,
 * server control, and content services.
 * 
 * @returns {Promise<void>}
 */
async function initializeServices() {
  logger.info('Initializing services...');
  
  try {
    await configService.initialize();
    await serverService.initialize();
    await contentService.initialize();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error: error.message });
    // Continue anyway - services can work without AC server installed
  }
}

/**
 * Start the HTTP server
 * 
 * @returns {Promise<void>}
 */
async function startServer() {
  return new Promise((resolve, reject) => {
    server.listen(config.port, () => {
      logger.info(`AC Server Manager started`, {
        port: config.port,
        env: config.nodeEnv,
        url: `http://localhost:${config.port}`
      });
      
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🏎️  AC Server Manager                            ║
║                                                    ║
║   Server running on: http://localhost:${config.port}       ║
║   Environment: ${config.nodeEnv.padEnd(30)}║
║                                                    ║
║   API Endpoints:                                   ║
║   • GET  /api/health     - Health check            ║
║   • GET  /api/configs    - Server configurations   ║
║   • GET  /api/server     - Server control          ║
║   • GET  /api/content    - Tracks and cars         ║
║   • GET  /api/entries    - Entry lists             ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
      
      resolve();
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      reject(error);
    });
  });
}

/**
 * Handle graceful shutdown
 * 
 * Closes the server and cleans up resources on termination signals.
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    // Stop AC server if running
    try {
      const status = serverService.getStatus();
      if (status.isRunning) {
        logger.info('Stopping AC server...');
        await serverService.stop();
      }
    } catch (error) {
      logger.error('Error stopping AC server', { error: error.message });
    }

    // Close HTTP server
    server.close((err) => {
      if (err) {
        logger.error('Error closing server', { error: err.message });
        process.exit(1);
      }
      
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Handle uncaught errors
 */
function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason: reason?.message || reason });
  });
}

/**
 * Main application startup
 */
async function main() {
  setupErrorHandlers();
  setupGracefulShutdown();
  
  await initializeServices();
  await startServer();
}

// Start the application
main().catch((error) => {
  logger.error('Failed to start application', { error: error.message });
  process.exit(1);
});

module.exports = server;

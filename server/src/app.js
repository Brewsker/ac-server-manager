/**
 * Express Application Configuration
 * 
 * Configures and exports the Express application with all middleware,
 * routes, and error handlers.
 * 
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./config/logger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware');

/**
 * Create Express application
 * @type {express.Application}
 */
const app = express();

// ============================================
// Security Middleware
// ============================================

// Set security-related HTTP headers
// In production, enable full CSP; in development, use a permissive policy
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Enable CORS with configuration
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// Request Parsing Middleware
// ============================================

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Logging Middleware
// ============================================

// HTTP request logging (skip in test environment)
if (!config.isTest) {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ============================================
// Routes
// ============================================

// Mount API routes
app.use('/api', routes);

// ============================================
// Error Handling
// ============================================

// Handle 404 - Route not found
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;

/**
 * Error Handler Middleware
 * 
 * Centralized error handling for Express application.
 * Formats errors consistently and logs appropriately.
 * 
 * @module middleware/errorHandler
 */

const logger = require('../config/logger');
const config = require('../config');
const { AppError } = require('../utils/errors');

/**
 * Global error handler middleware
 * 
 * Catches all errors and formats them for the API response.
 * Logs errors based on severity and environment.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let errors = err.errors || [];

  // Handle specific error types
  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose/Express-validator style validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({
      field: e.path || e.param,
      message: e.message || e.msg
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Log the error
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
    message,
    stack: err.stack
  };

  if (statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error', logData);
  }

  // Build response object
  const response = {
    success: false,
    error: {
      code,
      message
    }
  };

  // Add validation errors if present
  if (errors.length > 0) {
    response.error.errors = errors;
  }

  // Add stack trace in development
  if (config.isDevelopment && err.stack) {
    response.error.stack = err.stack.split('\n');
  }

  // Send response
  res.status(statusCode).json(response);
}

/**
 * Not Found handler middleware
 * 
 * Catches requests to non-existent routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
}

/**
 * Async handler wrapper
 * 
 * Wraps async route handlers to catch errors automatically.
 * Eliminates the need for try/catch in every route.
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 * 
 * @example
 * router.get('/items', asyncHandler(async (req, res) => {
 *   const items = await ItemService.getAll();
 *   res.json(items);
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

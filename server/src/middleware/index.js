/**
 * Middleware Index
 * 
 * Exports all middleware for easy importing.
 * 
 * @module middleware
 */

const { errorHandler, notFoundHandler, asyncHandler } = require('./errorHandler');
const validators = require('./validators');

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ...validators
};

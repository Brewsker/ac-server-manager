/**
 * Request Validation Middleware
 * 
 * Provides request validation using express-validator.
 * Includes common validation chains for reuse.
 * 
 * @module middleware/validators
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation result handler
 * 
 * Checks validation results and throws error if validation failed.
 * Use as the last middleware in a validation chain.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));
    
    throw new ValidationError('Validation failed', formattedErrors);
  }
  
  next();
}

// ============================================
// Common Validation Chains
// ============================================

/**
 * Validate UUID parameter
 */
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidation
];

/**
 * Validate pagination query parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidation
];

/**
 * Server configuration validation
 */
const validateServerConfig = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Server name must be 1-255 characters'),
  body('password')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Password must be max 255 characters'),
  body('adminPassword')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Admin password must be max 255 characters'),
  body('maxClients')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Max clients must be between 1 and 24'),
  body('udpPort')
    .optional()
    .isInt({ min: 1024, max: 65535 })
    .withMessage('UDP port must be between 1024 and 65535'),
  body('tcpPort')
    .optional()
    .isInt({ min: 1024, max: 65535 })
    .withMessage('TCP port must be between 1024 and 65535'),
  body('httpPort')
    .optional()
    .isInt({ min: 1024, max: 65535 })
    .withMessage('HTTP port must be between 1024 and 65535'),
  body('track')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Track name must be 1-255 characters'),
  body('practiceTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Practice time must be non-negative'),
  body('qualifyTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Qualify time must be non-negative'),
  body('raceLaps')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Race laps must be non-negative'),
  handleValidation
];

/**
 * Entry validation
 */
const validateEntry = [
  body('model')
    .trim()
    .notEmpty()
    .withMessage('Car model is required')
    .isLength({ max: 255 })
    .withMessage('Car model must be max 255 characters'),
  body('skin')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Skin must be max 255 characters'),
  body('driverName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Driver name must be max 255 characters'),
  body('team')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Team name must be max 255 characters'),
  body('guid')
    .optional()
    .trim()
    .isLength({ max: 64 })
    .withMessage('GUID must be max 64 characters'),
  body('ballast')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Ballast must be between 0 and 150'),
  body('restrictor')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Restrictor must be between 0 and 100'),
  handleValidation
];

/**
 * Entry list validation
 */
const validateEntryList = [
  body('entries')
    .isArray({ min: 1 })
    .withMessage('At least one entry is required'),
  body('entries.*.model')
    .trim()
    .notEmpty()
    .withMessage('Car model is required for each entry'),
  handleValidation
];

/**
 * Search query validation
 */
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Search query must be 1-255 characters'),
  handleValidation
];

module.exports = {
  handleValidation,
  validateUUID,
  validatePagination,
  validateServerConfig,
  validateEntry,
  validateEntryList,
  validateSearchQuery
};

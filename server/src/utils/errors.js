/**
 * Custom Error Classes
 * 
 * Provides standardized error handling across the application.
 * Includes HTTP status codes and error formatting.
 * 
 * @module utils/errors
 */

/**
 * Base application error class
 * 
 * @extends Error
 */
class AppError extends Error {
  /**
   * Creates a new AppError
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Application error code
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON representation
   * 
   * @returns {Object}
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode
      }
    };
  }
}

/**
 * Not Found Error (404)
 * 
 * @extends AppError
 */
class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError
   * 
   * @param {string} [message='Resource not found'] - Error message
   * @param {string} [code='NOT_FOUND'] - Error code
   */
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Validation Error (400)
 * 
 * @extends AppError
 */
class ValidationError extends AppError {
  /**
   * Creates a ValidationError
   * 
   * @param {string} message - Error message
   * @param {Array} [errors=[]] - Validation errors array
   */
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }

  /**
   * Convert to JSON representation
   * 
   * @returns {Object}
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        errors: this.errors
      }
    };
  }
}

/**
 * Conflict Error (409)
 * 
 * @extends AppError
 */
class ConflictError extends AppError {
  /**
   * Creates a ConflictError
   * 
   * @param {string} [message='Resource conflict'] - Error message
   */
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Unauthorized Error (401)
 * 
 * @extends AppError
 */
class UnauthorizedError extends AppError {
  /**
   * Creates an UnauthorizedError
   * 
   * @param {string} [message='Unauthorized'] - Error message
   */
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error (403)
 * 
 * @extends AppError
 */
class ForbiddenError extends AppError {
  /**
   * Creates a ForbiddenError
   * 
   * @param {string} [message='Forbidden'] - Error message
   */
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Server Error (500)
 * 
 * @extends AppError
 */
class ServerError extends AppError {
  /**
   * Creates a ServerError
   * 
   * @param {string} [message='Internal server error'] - Error message
   */
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ServerError
};

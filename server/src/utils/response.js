/**
 * API Response Helpers
 * 
 * Provides standardized response formatting for API endpoints.
 * Ensures consistent response structure across all endpoints.
 * 
 * @module utils/response
 */

/**
 * Send a success response
 * 
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} [statusCode=200] - HTTP status code
 * @param {string} [message='Success'] - Response message
 */
function success(res, data, statusCode = 200, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Send a created response (201)
 * 
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} [message='Resource created'] - Response message
 */
function created(res, data, message = 'Resource created') {
  return success(res, data, 201, message);
}

/**
 * Send a no content response (204)
 * 
 * @param {Object} res - Express response object
 */
function noContent(res) {
  return res.status(204).send();
}

/**
 * Send an error response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string} [code='ERROR'] - Error code
 * @param {Array} [errors=[]] - Additional error details
 */
function error(res, message, statusCode = 500, code = 'ERROR', errors = []) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      errors
    }
  });
}

/**
 * Send a not found response (404)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Resource not found'] - Error message
 */
function notFound(res, message = 'Resource not found') {
  return error(res, message, 404, 'NOT_FOUND');
}

/**
 * Send a validation error response (400)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Validation failed'] - Error message
 * @param {Array} [errors=[]] - Validation errors
 */
function validationError(res, message = 'Validation failed', errors = []) {
  return error(res, message, 400, 'VALIDATION_ERROR', errors);
}

/**
 * Send a conflict response (409)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Resource conflict'] - Error message
 */
function conflict(res, message = 'Resource conflict') {
  return error(res, message, 409, 'CONFLICT');
}

/**
 * Send an unauthorized response (401)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Unauthorized'] - Error message
 */
function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Send a forbidden response (403)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Forbidden'] - Error message
 */
function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, 'FORBIDDEN');
}

/**
 * Send a paginated response
 * 
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {number} pagination.page - Current page
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total items
 */
function paginated(res, data, pagination) {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  });
}

module.exports = {
  success,
  created,
  noContent,
  error,
  notFound,
  validationError,
  conflict,
  unauthorized,
  forbidden,
  paginated
};

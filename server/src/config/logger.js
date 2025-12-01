/**
 * Winston Logger Configuration
 * 
 * Configures application-wide logging with Winston.
 * Supports console output with colorization and file logging.
 * 
 * @module config/logger
 */

const winston = require('winston');
const config = require('./index');

/**
 * Custom log format with timestamp and colorization
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

/**
 * Console format with colors for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

/**
 * Logger transports configuration
 * @type {Array}
 */
const transports = [
  // Console transport - always enabled
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logLevel
  })
];

// Add file transports in non-test environments
if (!config.isTest) {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

/**
 * Winston logger instance
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports,
  // Don't exit on uncaught exceptions
  exitOnError: false
});

/**
 * Stream object for Morgan HTTP logging integration
 * @type {Object}
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;

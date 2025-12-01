/**
 * Application configuration module
 * 
 * Centralizes all configuration settings for the AC Server Manager.
 * Reads from environment variables with sensible defaults.
 * 
 * @module config/index
 */

require('dotenv').config();

/**
 * Application configuration object
 * @type {Object}
 */
const config = {
  /**
   * Server port number
   * @type {number}
   */
  port: parseInt(process.env.PORT, 10) || 3001,

  /**
   * Node environment (development, production, test)
   * @type {string}
   */
  nodeEnv: process.env.NODE_ENV || 'development',

  /**
   * Path to Assetto Corsa dedicated server installation
   * @type {string}
   */
  acServerPath: process.env.AC_SERVER_PATH || '',

  /**
   * Logging level (error, warn, info, http, verbose, debug, silly)
   * @type {string}
   */
  logLevel: process.env.LOG_LEVEL || 'info',

  /**
   * CORS allowed origins
   * @type {string}
   */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  /**
   * Session secret for any session-based auth
   * @type {string}
   */
  sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-me',

  /**
   * Check if running in development mode
   * @type {boolean}
   */
  isDevelopment: process.env.NODE_ENV !== 'production',

  /**
   * Check if running in production mode
   * @type {boolean}
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Check if running in test mode
   * @type {boolean}
   */
  isTest: process.env.NODE_ENV === 'test',

  /**
   * Default paths for AC server configuration files
   * @type {Object}
   */
  paths: {
    serverConfig: 'cfg/server_cfg.ini',
    entryList: 'cfg/entry_list.ini',
    tracks: 'content/tracks',
    cars: 'content/cars'
  }
};

module.exports = config;

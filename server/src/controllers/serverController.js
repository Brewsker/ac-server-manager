/**
 * Server Controller
 * 
 * Handles HTTP requests for AC server process control.
 * Provides endpoints for starting, stopping, and monitoring the server.
 * 
 * @module controllers/serverController
 */

const { serverService } = require('../services');
const response = require('../utils/response');
const { ConflictError, ServerError } = require('../utils/errors');

/**
 * Server Controller
 * Contains all handler methods for server control endpoints.
 */
const serverController = {
  /**
   * Get current server status
   * 
   * @route GET /api/server/status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getStatus(req, res) {
    const status = serverService.getStatus();
    response.success(res, status);
  },

  /**
   * Start the AC server
   * 
   * @route POST /api/server/start
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async start(req, res) {
    const { configId } = req.body;

    try {
      const result = await serverService.start(configId);
      response.success(res, result, 'Server started');
    } catch (error) {
      if (error.message.includes('already running')) {
        throw new ConflictError(error.message);
      }
      throw new ServerError(error.message);
    }
  },

  /**
   * Stop the AC server
   * 
   * @route POST /api/server/stop
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async stop(req, res) {
    try {
      const result = await serverService.stop();
      response.success(res, result, 'Server stopped');
    } catch (error) {
      if (error.message.includes('not running')) {
        throw new ConflictError(error.message);
      }
      throw new ServerError(error.message);
    }
  },

  /**
   * Restart the AC server
   * 
   * @route POST /api/server/restart
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async restart(req, res) {
    const { configId } = req.body;

    try {
      const result = await serverService.restart(configId);
      response.success(res, result, 'Server restarted');
    } catch (error) {
      throw new ServerError(error.message);
    }
  },

  /**
   * Kick a player from the server
   * 
   * @route POST /api/server/kick
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async kickPlayer(req, res) {
    const { guid, reason } = req.body;

    try {
      const result = await serverService.kickPlayer(guid, reason);
      response.success(res, result, 'Player kicked');
    } catch (error) {
      throw new ServerError(error.message);
    }
  },

  /**
   * Send a message to the server
   * 
   * @route POST /api/server/message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendMessage(req, res) {
    const { message } = req.body;

    try {
      const result = await serverService.sendMessage(message);
      response.success(res, result, 'Message sent');
    } catch (error) {
      throw new ServerError(error.message);
    }
  },

  /**
   * Get server logs
   * 
   * @route GET /api/server/logs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLogs(req, res) {
    const lines = parseInt(req.query.lines, 10) || 100;
    
    try {
      const logs = await serverService.getLogs(lines);
      response.success(res, { logs });
    } catch (error) {
      throw new ServerError(error.message);
    }
  }
};

module.exports = serverController;

/**
 * Configuration Controller
 * 
 * Handles HTTP requests for server configuration management.
 * Provides REST API endpoints for CRUD operations.
 * 
 * @module controllers/configController
 */

const { configService } = require('../services');
const response = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Configuration Controller
 * Contains all handler methods for config-related endpoints.
 */
const configController = {
  /**
   * Get all server configurations
   * 
   * @route GET /api/configs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAll(req, res) {
    const configs = configService.getAllConfigs();
    response.success(res, configs);
  },

  /**
   * Get default configuration values
   * 
   * @route GET /api/configs/defaults
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDefaults(req, res) {
    const defaults = configService.getDefaults();
    response.success(res, defaults);
  },

  /**
   * Get a single configuration by ID
   * 
   * @route GET /api/configs/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getById(req, res) {
    const { id } = req.params;
    const config = configService.getConfig(id);

    if (!config) {
      throw new NotFoundError('Configuration not found');
    }

    response.success(res, config);
  },

  /**
   * Create a new configuration
   * 
   * @route POST /api/configs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create(req, res) {
    const config = configService.createConfig(req.body);
    response.created(res, config, 'Configuration created successfully');
  },

  /**
   * Update an existing configuration
   * 
   * @route PUT /api/configs/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update(req, res) {
    const { id } = req.params;
    const config = configService.updateConfig(id, req.body);

    if (!config) {
      throw new NotFoundError('Configuration not found');
    }

    response.success(res, config, 'Configuration updated successfully');
  },

  /**
   * Delete a configuration
   * 
   * @route DELETE /api/configs/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete(req, res) {
    const { id } = req.params;
    const deleted = configService.deleteConfig(id);

    if (!deleted) {
      throw new NotFoundError('Configuration not found');
    }

    response.noContent(res);
  },

  /**
   * Save configuration to disk
   * 
   * @route POST /api/configs/:id/save
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async saveToDisk(req, res) {
    const { id } = req.params;
    
    try {
      await configService.saveConfigToDisk(id);
      response.success(res, null, 'Configuration saved to disk');
    } catch (error) {
      throw new NotFoundError('Configuration not found');
    }
  }
};

module.exports = configController;

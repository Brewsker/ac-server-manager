/**
 * Configuration Routes
 * 
 * Express router for server configuration endpoints.
 * 
 * @module routes/configRoutes
 */

const express = require('express');
const { configController } = require('../controllers');
const { asyncHandler, validateServerConfig } = require('../middleware');

const router = express.Router();

/**
 * @route GET /api/configs
 * @desc Get all server configurations
 * @access Public
 */
router.get('/', asyncHandler(configController.getAll));

/**
 * @route GET /api/configs/defaults
 * @desc Get default configuration values
 * @access Public
 */
router.get('/defaults', asyncHandler(configController.getDefaults));

/**
 * @route GET /api/configs/:id
 * @desc Get a single configuration by ID
 * @access Public
 */
router.get('/:id', asyncHandler(configController.getById));

/**
 * @route POST /api/configs
 * @desc Create a new configuration
 * @access Public
 */
router.post('/', validateServerConfig, asyncHandler(configController.create));

/**
 * @route PUT /api/configs/:id
 * @desc Update an existing configuration
 * @access Public
 */
router.put('/:id', validateServerConfig, asyncHandler(configController.update));

/**
 * @route DELETE /api/configs/:id
 * @desc Delete a configuration
 * @access Public
 */
router.delete('/:id', asyncHandler(configController.delete));

/**
 * @route POST /api/configs/:id/save
 * @desc Save configuration to disk
 * @access Public
 */
router.post('/:id/save', asyncHandler(configController.saveToDisk));

module.exports = router;

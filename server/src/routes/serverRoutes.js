/**
 * Server Control Routes
 * 
 * Express router for AC server process control endpoints.
 * 
 * @module routes/serverRoutes
 */

const express = require('express');
const { serverController } = require('../controllers');
const { asyncHandler } = require('../middleware');

const router = express.Router();

/**
 * @route GET /api/server/status
 * @desc Get current server status
 * @access Public
 */
router.get('/status', asyncHandler(serverController.getStatus));

/**
 * @route POST /api/server/start
 * @desc Start the AC server
 * @access Public
 */
router.post('/start', asyncHandler(serverController.start));

/**
 * @route POST /api/server/stop
 * @desc Stop the AC server
 * @access Public
 */
router.post('/stop', asyncHandler(serverController.stop));

/**
 * @route POST /api/server/restart
 * @desc Restart the AC server
 * @access Public
 */
router.post('/restart', asyncHandler(serverController.restart));

/**
 * @route POST /api/server/kick
 * @desc Kick a player from the server
 * @access Public
 */
router.post('/kick', asyncHandler(serverController.kickPlayer));

/**
 * @route POST /api/server/message
 * @desc Send a message to the server
 * @access Public
 */
router.post('/message', asyncHandler(serverController.sendMessage));

/**
 * @route GET /api/server/logs
 * @desc Get server logs
 * @access Public
 */
router.get('/logs', asyncHandler(serverController.getLogs));

module.exports = router;

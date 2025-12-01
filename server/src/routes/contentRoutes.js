/**
 * Content Routes
 * 
 * Express router for tracks and cars content endpoints.
 * 
 * @module routes/contentRoutes
 */

const express = require('express');
const { contentController } = require('../controllers');
const { asyncHandler, validateSearchQuery } = require('../middleware');

const router = express.Router();

/**
 * @route GET /api/content/tracks
 * @desc Get all available tracks
 * @access Public
 */
router.get('/tracks', asyncHandler(contentController.getTracks));

/**
 * @route GET /api/content/tracks/search
 * @desc Search tracks by name
 * @access Public
 */
router.get('/tracks/search', validateSearchQuery, asyncHandler(contentController.searchTracks));

/**
 * @route GET /api/content/tracks/:id
 * @desc Get a single track by ID
 * @access Public
 */
router.get('/tracks/:id', asyncHandler(contentController.getTrack));

/**
 * @route GET /api/content/cars
 * @desc Get all available cars
 * @access Public
 */
router.get('/cars', asyncHandler(contentController.getCars));

/**
 * @route GET /api/content/cars/search
 * @desc Search cars by name or brand
 * @access Public
 */
router.get('/cars/search', validateSearchQuery, asyncHandler(contentController.searchCars));

/**
 * @route GET /api/content/cars/:id
 * @desc Get a single car by ID
 * @access Public
 */
router.get('/cars/:id', asyncHandler(contentController.getCar));

/**
 * @route POST /api/content/refresh
 * @desc Refresh content cache
 * @access Public
 */
router.post('/refresh', asyncHandler(contentController.refresh));

module.exports = router;

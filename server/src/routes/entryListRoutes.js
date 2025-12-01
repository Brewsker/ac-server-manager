/**
 * Entry List Routes
 * 
 * Express router for entry list management endpoints.
 * 
 * @module routes/entryListRoutes
 */

const express = require('express');
const { entryListController } = require('../controllers');
const { asyncHandler, validateEntry, validateEntryList } = require('../middleware');

const router = express.Router();

/**
 * @route GET /api/entries
 * @desc Get all entry lists
 * @access Public
 */
router.get('/', asyncHandler(entryListController.getAll));

/**
 * @route GET /api/entries/:id
 * @desc Get a single entry list by ID
 * @access Public
 */
router.get('/:id', asyncHandler(entryListController.getById));

/**
 * @route POST /api/entries
 * @desc Create a new entry list
 * @access Public
 */
router.post('/', validateEntryList, asyncHandler(entryListController.create));

/**
 * @route PUT /api/entries/:id
 * @desc Update an existing entry list
 * @access Public
 */
router.put('/:id', asyncHandler(entryListController.update));

/**
 * @route DELETE /api/entries/:id
 * @desc Delete an entry list
 * @access Public
 */
router.delete('/:id', asyncHandler(entryListController.delete));

/**
 * @route POST /api/entries/:id/cars
 * @desc Add an entry to an entry list
 * @access Public
 */
router.post('/:id/cars', validateEntry, asyncHandler(entryListController.addEntry));

/**
 * @route PUT /api/entries/:id/cars/:entryId
 * @desc Update an entry in an entry list
 * @access Public
 */
router.put('/:id/cars/:entryId', asyncHandler(entryListController.updateEntry));

/**
 * @route DELETE /api/entries/:id/cars/:entryId
 * @desc Remove an entry from an entry list
 * @access Public
 */
router.delete('/:id/cars/:entryId', asyncHandler(entryListController.removeEntry));

/**
 * @route POST /api/entries/:id/save
 * @desc Save entry list to disk
 * @access Public
 */
router.post('/:id/save', asyncHandler(entryListController.saveToDisk));

module.exports = router;

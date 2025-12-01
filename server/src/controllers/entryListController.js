/**
 * Entry List Controller
 * 
 * Handles HTTP requests for entry list management.
 * Provides REST API endpoints for managing car/driver entries.
 * 
 * @module controllers/entryListController
 */

const { configService } = require('../services');
const response = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Entry List Controller
 * Contains all handler methods for entry list endpoints.
 */
const entryListController = {
  /**
   * Get all entry lists
   * 
   * @route GET /api/entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAll(req, res) {
    const entryLists = configService.getAllEntryLists();
    response.success(res, entryLists);
  },

  /**
   * Get a single entry list by ID
   * 
   * @route GET /api/entries/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getById(req, res) {
    const { id } = req.params;
    const entryList = configService.getEntryList(id);

    if (!entryList) {
      throw new NotFoundError('Entry list not found');
    }

    response.success(res, entryList);
  },

  /**
   * Create a new entry list
   * 
   * @route POST /api/entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create(req, res) {
    const entryList = configService.createEntryList(req.body);
    response.created(res, entryList, 'Entry list created successfully');
  },

  /**
   * Update an existing entry list
   * 
   * @route PUT /api/entries/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update(req, res) {
    const { id } = req.params;
    const entryList = configService.updateEntryList(id, req.body);

    if (!entryList) {
      throw new NotFoundError('Entry list not found');
    }

    response.success(res, entryList, 'Entry list updated successfully');
  },

  /**
   * Delete an entry list
   * 
   * @route DELETE /api/entries/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete(req, res) {
    const { id } = req.params;
    const deleted = configService.deleteEntryList(id);

    if (!deleted) {
      throw new NotFoundError('Entry list not found');
    }

    response.noContent(res);
  },

  /**
   * Add an entry to an entry list
   * 
   * @route POST /api/entries/:id/cars
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addEntry(req, res) {
    const { id } = req.params;
    const entryList = configService.getEntryList(id);

    if (!entryList) {
      throw new NotFoundError('Entry list not found');
    }

    const entry = entryList.addEntry(req.body);
    response.created(res, entry, 'Entry added successfully');
  },

  /**
   * Update an entry in an entry list
   * 
   * @route PUT /api/entries/:id/cars/:entryId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateEntry(req, res) {
    const { id, entryId } = req.params;
    const entryList = configService.getEntryList(id);

    if (!entryList) {
      throw new NotFoundError('Entry list not found');
    }

    const entry = entryList.updateEntry(entryId, req.body);

    if (!entry) {
      throw new NotFoundError('Entry not found');
    }

    response.success(res, entry, 'Entry updated successfully');
  },

  /**
   * Remove an entry from an entry list
   * 
   * @route DELETE /api/entries/:id/cars/:entryId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeEntry(req, res) {
    const { id, entryId } = req.params;
    const entryList = configService.getEntryList(id);

    if (!entryList) {
      throw new NotFoundError('Entry list not found');
    }

    const removed = entryList.removeEntry(entryId);

    if (!removed) {
      throw new NotFoundError('Entry not found');
    }

    response.noContent(res);
  },

  /**
   * Save entry list to disk
   * 
   * @route POST /api/entries/:id/save
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async saveToDisk(req, res) {
    const { id } = req.params;
    
    try {
      await configService.saveEntryListToDisk(id);
      response.success(res, null, 'Entry list saved to disk');
    } catch (error) {
      throw new NotFoundError('Entry list not found');
    }
  }
};

module.exports = entryListController;

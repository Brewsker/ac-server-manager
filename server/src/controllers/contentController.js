/**
 * Content Controller
 * 
 * Handles HTTP requests for tracks and cars content.
 * Provides endpoints for listing and searching available content.
 * 
 * @module controllers/contentController
 */

const { contentService } = require('../services');
const response = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Content Controller
 * Contains all handler methods for content-related endpoints.
 */
const contentController = {
  /**
   * Get all available tracks
   * 
   * @route GET /api/content/tracks
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTracks(req, res) {
    const refresh = req.query.refresh === 'true';
    const tracks = await contentService.getTracks(refresh);
    response.success(res, tracks);
  },

  /**
   * Get a single track by ID
   * 
   * @route GET /api/content/tracks/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTrack(req, res) {
    const { id } = req.params;
    const track = await contentService.getTrack(id);

    if (!track) {
      throw new NotFoundError('Track not found');
    }

    response.success(res, track);
  },

  /**
   * Search tracks by name
   * 
   * @route GET /api/content/tracks/search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchTracks(req, res) {
    const { q } = req.query;
    
    if (!q) {
      const tracks = await contentService.getTracks();
      return response.success(res, tracks);
    }

    const tracks = await contentService.searchTracks(q);
    response.success(res, tracks);
  },

  /**
   * Get all available cars
   * 
   * @route GET /api/content/cars
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCars(req, res) {
    const refresh = req.query.refresh === 'true';
    const cars = await contentService.getCars(refresh);
    response.success(res, cars);
  },

  /**
   * Get a single car by ID
   * 
   * @route GET /api/content/cars/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCar(req, res) {
    const { id } = req.params;
    const car = await contentService.getCar(id);

    if (!car) {
      throw new NotFoundError('Car not found');
    }

    response.success(res, car);
  },

  /**
   * Search cars by name or brand
   * 
   * @route GET /api/content/cars/search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchCars(req, res) {
    const { q } = req.query;
    
    if (!q) {
      const cars = await contentService.getCars();
      return response.success(res, cars);
    }

    const cars = await contentService.searchCars(q);
    response.success(res, cars);
  },

  /**
   * Refresh content cache
   * 
   * @route POST /api/content/refresh
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refresh(req, res) {
    contentService.invalidateCache();
    const result = await contentService.scanContent();
    response.success(res, {
      tracksCount: result.tracks.length,
      carsCount: result.cars.length
    }, 'Content cache refreshed');
  }
};

module.exports = contentController;

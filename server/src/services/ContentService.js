/**
 * Content Service
 * 
 * Manages tracks and cars available for the AC server.
 * Scans content directories and provides metadata.
 * 
 * @module services/ContentService
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const logger = require('../config/logger');

/**
 * ContentService class
 * 
 * Provides access to available tracks and cars
 * from the AC server content directories.
 */
class ContentService {
  /**
   * Creates a new ContentService instance
   */
  constructor() {
    this.basePath = config.acServerPath;
    this.tracksPath = path.join(this.basePath, 'content', 'tracks');
    this.carsPath = path.join(this.basePath, 'content', 'cars');
    
    // Cache for content data
    this.tracksCache = null;
    this.carsCache = null;
    this.lastScan = null;
    
    // Cache TTL in milliseconds (5 minutes)
    this.cacheTTL = 5 * 60 * 1000;
  }

  /**
   * Initialize the service
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('ContentService initialized');
    await this.scanContent();
  }

  /**
   * Check if cache is valid
   * 
   * @private
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.lastScan) return false;
    return Date.now() - this.lastScan < this.cacheTTL;
  }

  /**
   * Invalidate the content cache
   */
  invalidateCache() {
    this.tracksCache = null;
    this.carsCache = null;
    this.lastScan = null;
  }

  /**
   * Scan content directories for tracks and cars
   * 
   * @returns {Promise<Object>} Scan results
   */
  async scanContent() {
    logger.info('Scanning content directories');

    const [tracks, cars] = await Promise.all([
      this.scanTracks(),
      this.scanCars()
    ]);

    this.tracksCache = tracks;
    this.carsCache = cars;
    this.lastScan = Date.now();

    return { tracks, cars };
  }

  /**
   * Get all available tracks
   * 
   * @param {boolean} [forceRefresh=false] - Force cache refresh
   * @returns {Promise<Object[]>} Array of track objects
   */
  async getTracks(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid() && this.tracksCache) {
      return this.tracksCache;
    }

    this.tracksCache = await this.scanTracks();
    this.lastScan = Date.now();
    return this.tracksCache;
  }

  /**
   * Get a specific track by ID
   * 
   * @param {string} trackId - Track identifier
   * @returns {Promise<Object|null>} Track object or null
   */
  async getTrack(trackId) {
    const tracks = await this.getTracks();
    return tracks.find(t => t.id === trackId) || null;
  }

  /**
   * Scan tracks directory
   * 
   * @private
   * @returns {Promise<Object[]>}
   */
  async scanTracks() {
    const tracks = [];

    try {
      const entries = await fs.readdir(this.tracksPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const trackInfo = await this.getTrackInfo(entry.name);
        if (trackInfo) {
          tracks.push(trackInfo);
        }
      }

      logger.info(`Found ${tracks.length} tracks`);
    } catch (error) {
      logger.warn('Could not scan tracks directory', { 
        path: this.tracksPath,
        error: error.message 
      });
    }

    return tracks;
  }

  /**
   * Get information about a specific track
   * 
   * @private
   * @param {string} trackId - Track folder name
   * @returns {Promise<Object|null>}
   */
  async getTrackInfo(trackId) {
    try {
      const trackPath = path.join(this.tracksPath, trackId);
      const uiPath = path.join(trackPath, 'ui');
      
      // Try to read ui_track.json for metadata
      let metadata = { name: trackId };
      
      try {
        const uiJsonPath = path.join(uiPath, 'ui_track.json');
        const content = await fs.readFile(uiJsonPath, 'utf-8');
        const parsed = JSON.parse(content);
        metadata = {
          ...metadata,
          ...parsed,
          name: parsed.name || trackId
        };
      } catch {
        // No UI JSON, use defaults
      }

      // Get track configurations (layouts)
      const configs = await this.getTrackConfigs(trackPath);

      return {
        id: trackId,
        name: metadata.name,
        description: metadata.description || '',
        country: metadata.country || '',
        city: metadata.city || '',
        length: metadata.length || '',
        pitboxes: metadata.pitboxes || 0,
        configs: configs,
        path: trackPath
      };
    } catch (error) {
      logger.debug(`Could not get track info for ${trackId}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get track configurations (layouts)
   * 
   * @private
   * @param {string} trackPath - Path to track folder
   * @returns {Promise<string[]>}
   */
  async getTrackConfigs(trackPath) {
    const configs = [''];  // Default empty config

    try {
      const uiPath = path.join(trackPath, 'ui');
      const entries = await fs.readdir(uiPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'skin') {
          configs.push(entry.name);
        }
      }
    } catch {
      // No additional configs
    }

    return configs;
  }

  /**
   * Get all available cars
   * 
   * @param {boolean} [forceRefresh=false] - Force cache refresh
   * @returns {Promise<Object[]>} Array of car objects
   */
  async getCars(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid() && this.carsCache) {
      return this.carsCache;
    }

    this.carsCache = await this.scanCars();
    this.lastScan = Date.now();
    return this.carsCache;
  }

  /**
   * Get a specific car by ID
   * 
   * @param {string} carId - Car identifier
   * @returns {Promise<Object|null>} Car object or null
   */
  async getCar(carId) {
    const cars = await this.getCars();
    return cars.find(c => c.id === carId) || null;
  }

  /**
   * Scan cars directory
   * 
   * @private
   * @returns {Promise<Object[]>}
   */
  async scanCars() {
    const cars = [];

    try {
      const entries = await fs.readdir(this.carsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const carInfo = await this.getCarInfo(entry.name);
        if (carInfo) {
          cars.push(carInfo);
        }
      }

      logger.info(`Found ${cars.length} cars`);
    } catch (error) {
      logger.warn('Could not scan cars directory', { 
        path: this.carsPath,
        error: error.message 
      });
    }

    return cars;
  }

  /**
   * Get information about a specific car
   * 
   * @private
   * @param {string} carId - Car folder name
   * @returns {Promise<Object|null>}
   */
  async getCarInfo(carId) {
    try {
      const carPath = path.join(this.carsPath, carId);
      const uiPath = path.join(carPath, 'ui');
      
      // Try to read ui_car.json for metadata
      let metadata = { name: carId };
      
      try {
        const uiJsonPath = path.join(uiPath, 'ui_car.json');
        const content = await fs.readFile(uiJsonPath, 'utf-8');
        const parsed = JSON.parse(content);
        metadata = {
          ...metadata,
          ...parsed,
          name: parsed.name || carId
        };
      } catch {
        // No UI JSON, use defaults
      }

      // Get available skins
      const skins = await this.getCarSkins(carPath);

      return {
        id: carId,
        name: metadata.name,
        brand: metadata.brand || '',
        description: metadata.description || '',
        class: metadata.class || '',
        tags: metadata.tags || [],
        specs: {
          bhp: metadata.bhp || '',
          torque: metadata.torque || '',
          weight: metadata.weight || '',
          topspeed: metadata.topspeed || '',
          acceleration: metadata.acceleration || ''
        },
        skins: skins,
        path: carPath
      };
    } catch (error) {
      logger.debug(`Could not get car info for ${carId}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get available skins for a car
   * 
   * @private
   * @param {string} carPath - Path to car folder
   * @returns {Promise<string[]>}
   */
  async getCarSkins(carPath) {
    const skins = [];

    try {
      const skinsPath = path.join(carPath, 'skins');
      const entries = await fs.readdir(skinsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          skins.push(entry.name);
        }
      }
    } catch {
      // No skins folder or error reading
    }

    return skins;
  }

  /**
   * Search tracks by name
   * 
   * @param {string} query - Search query
   * @returns {Promise<Object[]>} Matching tracks
   */
  async searchTracks(query) {
    const tracks = await this.getTracks();
    const lowerQuery = query.toLowerCase();
    
    return tracks.filter(track => 
      track.name.toLowerCase().includes(lowerQuery) ||
      track.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search cars by name or brand
   * 
   * @param {string} query - Search query
   * @returns {Promise<Object[]>} Matching cars
   */
  async searchCars(query) {
    const cars = await this.getCars();
    const lowerQuery = query.toLowerCase();
    
    return cars.filter(car => 
      car.name.toLowerCase().includes(lowerQuery) ||
      car.id.toLowerCase().includes(lowerQuery) ||
      car.brand.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
module.exports = new ContentService();

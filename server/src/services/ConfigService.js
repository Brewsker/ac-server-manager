/**
 * Configuration Service
 * 
 * Handles reading, writing, and managing AC server configuration files.
 * Provides CRUD operations for server configurations.
 * 
 * @module services/ConfigService
 */

const fs = require('fs').promises;
const path = require('path');
const ini = require('ini');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../config/logger');
const ServerConfig = require('../models/ServerConfig');
const { EntryList } = require('../models/EntryList');

/**
 * ConfigService class
 * 
 * Manages server configuration files and provides an API
 * for configuration CRUD operations.
 */
class ConfigService {
  /**
   * Creates a new ConfigService instance
   * 
   * @param {string} basePath - Base path to AC server installation
   */
  constructor(basePath = config.acServerPath) {
    this.basePath = basePath;
    this.configPath = path.join(basePath, 'cfg');
    
    // In-memory storage for configurations (for demo/development)
    this.configs = new Map();
    this.entryLists = new Map();
  }

  /**
   * Initialize the service
   * Ensures configuration directory exists and loads existing configs
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create config directory if it doesn't exist
      await fs.mkdir(this.configPath, { recursive: true });
      logger.info('ConfigService initialized', { path: this.configPath });
      
      // Try to load existing configuration
      await this.loadFromDisk();
    } catch (error) {
      logger.warn('Could not initialize config directory', { error: error.message });
    }
  }

  /**
   * Load existing configuration from disk
   * 
   * @private
   * @returns {Promise<void>}
   */
  async loadFromDisk() {
    try {
      const serverCfgPath = path.join(this.configPath, 'server_cfg.ini');
      const content = await fs.readFile(serverCfgPath, 'utf-8');
      const serverConfig = ServerConfig.fromINI(content);
      this.configs.set(serverConfig.id, serverConfig);
      logger.info('Loaded server configuration from disk');
    } catch (error) {
      logger.debug('No existing server_cfg.ini found', { error: error.message });
    }

    try {
      const entryListPath = path.join(this.configPath, 'entry_list.ini');
      const content = await fs.readFile(entryListPath, 'utf-8');
      const entryList = EntryList.fromINI(content);
      this.entryLists.set(entryList.id, entryList);
      logger.info('Loaded entry list from disk');
    } catch (error) {
      logger.debug('No existing entry_list.ini found', { error: error.message });
    }
  }

  // ============================================
  // Server Configuration Methods
  // ============================================

  /**
   * Get all server configurations
   * 
   * @returns {ServerConfig[]} Array of all configurations
   */
  getAllConfigs() {
    return Array.from(this.configs.values());
  }

  /**
   * Get a server configuration by ID
   * 
   * @param {string} id - Configuration ID
   * @returns {ServerConfig|null} Configuration or null if not found
   */
  getConfig(id) {
    return this.configs.get(id) || null;
  }

  /**
   * Get the currently active configuration
   * Returns the first configuration if multiple exist
   * 
   * @returns {ServerConfig|null} Active configuration or null
   */
  getActiveConfig() {
    const configs = this.getAllConfigs();
    return configs.length > 0 ? configs[0] : null;
  }

  /**
   * Create a new server configuration
   * 
   * @param {Object} configData - Configuration data
   * @returns {ServerConfig} Created configuration
   */
  createConfig(configData) {
    const serverConfig = new ServerConfig(configData);
    this.configs.set(serverConfig.id, serverConfig);
    logger.info('Created new server configuration', { id: serverConfig.id });
    return serverConfig;
  }

  /**
   * Update an existing server configuration
   * 
   * @param {string} id - Configuration ID
   * @param {Object} updates - Update data
   * @returns {ServerConfig|null} Updated configuration or null if not found
   */
  updateConfig(id, updates) {
    const serverConfig = this.configs.get(id);
    if (!serverConfig) {
      return null;
    }
    serverConfig.update(updates);
    logger.info('Updated server configuration', { id });
    return serverConfig;
  }

  /**
   * Delete a server configuration
   * 
   * @param {string} id - Configuration ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteConfig(id) {
    const deleted = this.configs.delete(id);
    if (deleted) {
      logger.info('Deleted server configuration', { id });
    }
    return deleted;
  }

  /**
   * Save configuration to disk
   * 
   * @param {string} id - Configuration ID
   * @returns {Promise<void>}
   */
  async saveConfigToDisk(id) {
    const serverConfig = this.configs.get(id);
    if (!serverConfig) {
      throw new Error('Configuration not found');
    }

    const filePath = path.join(this.configPath, 'server_cfg.ini');
    await fs.writeFile(filePath, serverConfig.toINI(), 'utf-8');
    logger.info('Saved server configuration to disk', { path: filePath });
  }

  // ============================================
  // Entry List Methods
  // ============================================

  /**
   * Get all entry lists
   * 
   * @returns {EntryList[]} Array of all entry lists
   */
  getAllEntryLists() {
    return Array.from(this.entryLists.values());
  }

  /**
   * Get an entry list by ID
   * 
   * @param {string} id - Entry list ID
   * @returns {EntryList|null} Entry list or null if not found
   */
  getEntryList(id) {
    return this.entryLists.get(id) || null;
  }

  /**
   * Get the currently active entry list
   * 
   * @returns {EntryList|null} Active entry list or null
   */
  getActiveEntryList() {
    const lists = this.getAllEntryLists();
    return lists.length > 0 ? lists[0] : null;
  }

  /**
   * Create a new entry list
   * 
   * @param {Object} data - Entry list data
   * @returns {EntryList} Created entry list
   */
  createEntryList(data) {
    const entryList = new EntryList(data);
    this.entryLists.set(entryList.id, entryList);
    logger.info('Created new entry list', { id: entryList.id });
    return entryList;
  }

  /**
   * Update an entry list
   * 
   * @param {string} id - Entry list ID
   * @param {Object} updates - Update data
   * @returns {EntryList|null} Updated entry list or null
   */
  updateEntryList(id, updates) {
    const entryList = this.entryLists.get(id);
    if (!entryList) {
      return null;
    }

    // Update entries if provided
    if (updates.entries) {
      entryList.clear();
      updates.entries.forEach(e => entryList.addEntry(e));
    }

    logger.info('Updated entry list', { id });
    return entryList;
  }

  /**
   * Delete an entry list
   * 
   * @param {string} id - Entry list ID
   * @returns {boolean} True if deleted
   */
  deleteEntryList(id) {
    const deleted = this.entryLists.delete(id);
    if (deleted) {
      logger.info('Deleted entry list', { id });
    }
    return deleted;
  }

  /**
   * Save entry list to disk
   * 
   * @param {string} id - Entry list ID
   * @returns {Promise<void>}
   */
  async saveEntryListToDisk(id) {
    const entryList = this.entryLists.get(id);
    if (!entryList) {
      throw new Error('Entry list not found');
    }

    const filePath = path.join(this.configPath, 'entry_list.ini');
    await fs.writeFile(filePath, entryList.toINI(), 'utf-8');
    logger.info('Saved entry list to disk', { path: filePath });
  }

  /**
   * Get default configuration values
   * 
   * @returns {Object} Default configuration
   */
  getDefaults() {
    return ServerConfig.getDefaults();
  }
}

// Export singleton instance
module.exports = new ConfigService();

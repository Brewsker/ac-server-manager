/**
 * Server Configuration Model
 * 
 * Represents the Assetto Corsa server configuration (server_cfg.ini).
 * Provides validation, parsing, and serialization capabilities.
 * 
 * @module models/ServerConfig
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Default server configuration values
 * Based on Assetto Corsa dedicated server defaults
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
  // Server settings
  name: 'AC Server',
  password: '',
  adminPassword: 'admin',
  maxClients: 16,
  udpPort: 9600,
  tcpPort: 9600,
  httpPort: 8081,
  registerToLobby: 1,
  pickupModeEnabled: 1,

  // Track settings
  track: 'imola',
  trackConfig: '',

  // Session settings
  practiceTime: 10,
  qualifyTime: 15,
  raceTime: 0,
  raceLaps: 10,

  // Game settings
  abs: 1,
  tractionControl: 1,
  stabilityControl: 1,
  autoClutch: 1,
  tyreWear: 1,
  fuelRate: 1,
  damage: 50,

  // Weather and time
  sunAngle: 16,
  timeOfDay: '10:00',
  weather: 'clear',

  // Advanced settings
  jumpStart: 0,
  lockedEntryList: 0,
  loopMode: 1,
  maxBallast: 0,
  qualifyMaxWait: 120,
  raceExtraLap: 0,
  racePitWindowStart: 0,
  racePitWindowEnd: 0,
  reversedGridRacePositions: 0,
  votingQuorum: 75,
  voteKickEnabled: 1,
  blacklistMode: 0
};

/**
 * ServerConfig class
 * 
 * Represents and manages Assetto Corsa server configuration.
 * Handles parsing, validation, and INI file generation.
 */
class ServerConfig {
  /**
   * Creates a new ServerConfig instance
   * 
   * @param {Object} config - Configuration object
   * @param {string} [config.id] - Unique identifier
   * @param {string} [config.name] - Server name
   * @param {string} [config.password] - Server password
   * @param {number} [config.maxClients] - Maximum connected clients
   */
  constructor(config = {}) {
    // Generate unique ID if not provided
    this.id = config.id || uuidv4();
    
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Store creation and modification timestamps
    this.createdAt = config.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get the server name
   * @returns {string} Server name
   */
  get name() {
    return this.config.name;
  }

  /**
   * Set the server name
   * @param {string} value - New server name
   */
  set name(value) {
    this.config.name = value;
    this.markUpdated();
  }

  /**
   * Get the current track
   * @returns {string} Track name
   */
  get track() {
    return this.config.track;
  }

  /**
   * Set the current track
   * @param {string} value - Track name
   */
  set track(value) {
    this.config.track = value;
    this.markUpdated();
  }

  /**
   * Mark configuration as updated
   * Updates the updatedAt timestamp
   * @private
   */
  markUpdated() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Update multiple configuration values
   * 
   * @param {Object} updates - Object containing configuration updates
   * @returns {ServerConfig} Returns this for chaining
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key in this.config) {
        this.config[key] = updates[key];
      }
    });
    this.markUpdated();
    return this;
  }

  /**
   * Validate the configuration
   * 
   * @returns {Object} Validation result with isValid and errors array
   */
  validate() {
    const errors = [];

    // Validate server name
    if (!this.config.name || this.config.name.trim().length === 0) {
      errors.push('Server name is required');
    }

    // Validate max clients (1-24 for AC)
    if (this.config.maxClients < 1 || this.config.maxClients > 24) {
      errors.push('Max clients must be between 1 and 24');
    }

    // Validate ports
    if (this.config.udpPort < 1024 || this.config.udpPort > 65535) {
      errors.push('UDP port must be between 1024 and 65535');
    }
    if (this.config.tcpPort < 1024 || this.config.tcpPort > 65535) {
      errors.push('TCP port must be between 1024 and 65535');
    }
    if (this.config.httpPort < 1024 || this.config.httpPort > 65535) {
      errors.push('HTTP port must be between 1024 and 65535');
    }

    // Validate track
    if (!this.config.track || this.config.track.trim().length === 0) {
      errors.push('Track is required');
    }

    // Validate session times
    if (this.config.practiceTime < 0) {
      errors.push('Practice time cannot be negative');
    }
    if (this.config.qualifyTime < 0) {
      errors.push('Qualify time cannot be negative');
    }
    if (this.config.raceLaps < 0) {
      errors.push('Race laps cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert configuration to INI format string
   * 
   * @returns {string} INI formatted configuration string
   */
  toINI() {
    const lines = [
      '[SERVER]',
      `NAME=${this.config.name}`,
      `PASSWORD=${this.config.password}`,
      `ADMIN_PASSWORD=${this.config.adminPassword}`,
      `MAX_CLIENTS=${this.config.maxClients}`,
      `UDP_PORT=${this.config.udpPort}`,
      `TCP_PORT=${this.config.tcpPort}`,
      `HTTP_PORT=${this.config.httpPort}`,
      `REGISTER_TO_LOBBY=${this.config.registerToLobby}`,
      `PICKUP_MODE_ENABLED=${this.config.pickupModeEnabled}`,
      `TRACK=${this.config.track}`,
      `CONFIG_TRACK=${this.config.trackConfig}`,
      `SUN_ANGLE=${this.config.sunAngle}`,
      '',
      '[PRACTICE]',
      `NAME=Practice`,
      `TIME=${this.config.practiceTime}`,
      `IS_OPEN=1`,
      '',
      '[QUALIFY]',
      `NAME=Qualify`,
      `TIME=${this.config.qualifyTime}`,
      `IS_OPEN=1`,
      '',
      '[RACE]',
      `NAME=Race`,
      `TIME=${this.config.raceTime}`,
      `LAPS=${this.config.raceLaps}`,
      `WAIT_TIME=60`,
      '',
      '[DYNAMIC_TRACK]',
      `SESSION_START=95`,
      `RANDOMNESS=2`,
      `SESSION_TRANSFER=90`,
      `LAP_GAIN=1`,
      '',
      '[WEATHER_0]',
      `GRAPHICS=${this.config.weather}`,
      `BASE_TEMPERATURE_AMBIENT=18`,
      `BASE_TEMPERATURE_ROAD=6`,
      `VARIATION_AMBIENT=1`,
      `VARIATION_ROAD=1`
    ];

    return lines.join('\n');
  }

  /**
   * Create a ServerConfig from an INI string
   * 
   * @static
   * @param {string} iniString - INI formatted string
   * @returns {ServerConfig} New ServerConfig instance
   */
  static fromINI(iniString) {
    const ini = require('ini');
    const parsed = ini.parse(iniString);
    
    const config = {};

    // Parse SERVER section
    if (parsed.SERVER) {
      config.name = parsed.SERVER.NAME || DEFAULT_CONFIG.name;
      config.password = parsed.SERVER.PASSWORD || '';
      config.adminPassword = parsed.SERVER.ADMIN_PASSWORD || '';
      config.maxClients = parseInt(parsed.SERVER.MAX_CLIENTS, 10) || DEFAULT_CONFIG.maxClients;
      config.udpPort = parseInt(parsed.SERVER.UDP_PORT, 10) || DEFAULT_CONFIG.udpPort;
      config.tcpPort = parseInt(parsed.SERVER.TCP_PORT, 10) || DEFAULT_CONFIG.tcpPort;
      config.httpPort = parseInt(parsed.SERVER.HTTP_PORT, 10) || DEFAULT_CONFIG.httpPort;
      config.registerToLobby = parseInt(parsed.SERVER.REGISTER_TO_LOBBY, 10) || 0;
      config.pickupModeEnabled = parseInt(parsed.SERVER.PICKUP_MODE_ENABLED, 10) || 0;
      config.track = parsed.SERVER.TRACK || DEFAULT_CONFIG.track;
      config.trackConfig = parsed.SERVER.CONFIG_TRACK || '';
      config.sunAngle = parseInt(parsed.SERVER.SUN_ANGLE, 10) || DEFAULT_CONFIG.sunAngle;
    }

    // Parse session sections
    if (parsed.PRACTICE) {
      config.practiceTime = parseInt(parsed.PRACTICE.TIME, 10) || 0;
    }
    if (parsed.QUALIFY) {
      config.qualifyTime = parseInt(parsed.QUALIFY.TIME, 10) || 0;
    }
    if (parsed.RACE) {
      config.raceTime = parseInt(parsed.RACE.TIME, 10) || 0;
      config.raceLaps = parseInt(parsed.RACE.LAPS, 10) || 0;
    }

    return new ServerConfig(config);
  }

  /**
   * Convert to plain object for JSON serialization
   * 
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      ...this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a ServerConfig from a plain object
   * 
   * @static
   * @param {Object} obj - Plain object
   * @returns {ServerConfig} New ServerConfig instance
   */
  static fromJSON(obj) {
    return new ServerConfig(obj);
  }

  /**
   * Get default configuration values
   * 
   * @static
   * @returns {Object} Default configuration object
   */
  static getDefaults() {
    return { ...DEFAULT_CONFIG };
  }
}

module.exports = ServerConfig;

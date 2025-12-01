/**
 * Server Status Model
 * 
 * Represents the current state of the Assetto Corsa server process.
 * Tracks running status, connected players, and session info.
 * 
 * @module models/ServerStatus
 */

/**
 * Server status enumeration
 * @constant {Object}
 */
const ServerState = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error'
};

/**
 * Session type enumeration
 * @constant {Object}
 */
const SessionType = {
  PRACTICE: 'practice',
  QUALIFY: 'qualify',
  RACE: 'race',
  BOOKING: 'booking'
};

/**
 * ServerStatus class
 * 
 * Maintains and exposes the current state of the AC server.
 */
class ServerStatus {
  /**
   * Creates a new ServerStatus instance
   */
  constructor() {
    /** @type {string} Current server state */
    this.state = ServerState.STOPPED;
    
    /** @type {number|null} Process ID of the running server */
    this.pid = null;
    
    /** @type {string|null} Server name */
    this.serverName = null;
    
    /** @type {string|null} Current track */
    this.track = null;
    
    /** @type {string|null} Track configuration */
    this.trackConfig = null;
    
    /** @type {string|null} Current session type */
    this.sessionType = null;
    
    /** @type {number} Time remaining in current session (minutes) */
    this.sessionTimeRemaining = 0;
    
    /** @type {number} Current lap in race session */
    this.currentLap = 0;
    
    /** @type {number} Total laps in race session */
    this.totalLaps = 0;
    
    /** @type {Array} Connected players */
    this.players = [];
    
    /** @type {number} Maximum players allowed */
    this.maxPlayers = 0;
    
    /** @type {string|null} Last error message */
    this.lastError = null;
    
    /** @type {Date|null} Server start time */
    this.startedAt = null;
    
    /** @type {Date} Last status update time */
    this.updatedAt = new Date();
  }

  /**
   * Get player count
   * @returns {number} Number of connected players
   */
  get playerCount() {
    return this.players.length;
  }

  /**
   * Check if server is running
   * @returns {boolean} True if server is running
   */
  get isRunning() {
    return this.state === ServerState.RUNNING;
  }

  /**
   * Check if server is stopped
   * @returns {boolean} True if server is stopped
   */
  get isStopped() {
    return this.state === ServerState.STOPPED;
  }

  /**
   * Get server uptime in seconds
   * @returns {number|null} Uptime in seconds or null if not running
   */
  get uptime() {
    if (!this.startedAt || !this.isRunning) {
      return null;
    }
    return Math.floor((new Date() - this.startedAt) / 1000);
  }

  /**
   * Set server state to starting
   * 
   * @param {string} serverName - Name of the server
   * @param {string} track - Track being loaded
   */
  setStarting(serverName, track) {
    this.state = ServerState.STARTING;
    this.serverName = serverName;
    this.track = track;
    this.lastError = null;
    this.markUpdated();
  }

  /**
   * Set server state to running
   * 
   * @param {number} pid - Process ID
   * @param {number} maxPlayers - Maximum players
   */
  setRunning(pid, maxPlayers) {
    this.state = ServerState.RUNNING;
    this.pid = pid;
    this.maxPlayers = maxPlayers;
    this.startedAt = new Date();
    this.lastError = null;
    this.markUpdated();
  }

  /**
   * Set server state to stopping
   */
  setStopping() {
    this.state = ServerState.STOPPING;
    this.markUpdated();
  }

  /**
   * Set server state to stopped
   */
  setStopped() {
    this.state = ServerState.STOPPED;
    this.pid = null;
    this.players = [];
    this.sessionType = null;
    this.startedAt = null;
    this.markUpdated();
  }

  /**
   * Set server state to error
   * 
   * @param {string} error - Error message
   */
  setError(error) {
    this.state = ServerState.ERROR;
    this.lastError = error;
    this.pid = null;
    this.markUpdated();
  }

  /**
   * Update session information
   * 
   * @param {Object} sessionInfo - Session information
   * @param {string} sessionInfo.type - Session type
   * @param {number} [sessionInfo.timeRemaining] - Time remaining
   * @param {number} [sessionInfo.currentLap] - Current lap
   * @param {number} [sessionInfo.totalLaps] - Total laps
   */
  updateSession(sessionInfo) {
    this.sessionType = sessionInfo.type || this.sessionType;
    this.sessionTimeRemaining = sessionInfo.timeRemaining || 0;
    this.currentLap = sessionInfo.currentLap || 0;
    this.totalLaps = sessionInfo.totalLaps || 0;
    this.markUpdated();
  }

  /**
   * Add a player to the server
   * 
   * @param {Object} player - Player information
   * @param {string} player.name - Player name
   * @param {string} player.guid - Player Steam GUID
   * @param {string} player.car - Car being driven
   */
  addPlayer(player) {
    const exists = this.players.find(p => p.guid === player.guid);
    if (!exists) {
      this.players.push({
        name: player.name,
        guid: player.guid,
        car: player.car,
        connectedAt: new Date()
      });
      this.markUpdated();
    }
  }

  /**
   * Remove a player from the server
   * 
   * @param {string} guid - Player Steam GUID
   * @returns {boolean} True if player was removed
   */
  removePlayer(guid) {
    const index = this.players.findIndex(p => p.guid === guid);
    if (index !== -1) {
      this.players.splice(index, 1);
      this.markUpdated();
      return true;
    }
    return false;
  }

  /**
   * Clear all players
   */
  clearPlayers() {
    this.players = [];
    this.markUpdated();
  }

  /**
   * Mark status as updated
   * @private
   */
  markUpdated() {
    this.updatedAt = new Date();
  }

  /**
   * Convert to plain object for JSON serialization
   * 
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      state: this.state,
      pid: this.pid,
      serverName: this.serverName,
      track: this.track,
      trackConfig: this.trackConfig,
      sessionType: this.sessionType,
      sessionTimeRemaining: this.sessionTimeRemaining,
      currentLap: this.currentLap,
      totalLaps: this.totalLaps,
      players: this.players,
      playerCount: this.playerCount,
      maxPlayers: this.maxPlayers,
      isRunning: this.isRunning,
      uptime: this.uptime,
      lastError: this.lastError,
      startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Reset status to initial state
   */
  reset() {
    this.state = ServerState.STOPPED;
    this.pid = null;
    this.serverName = null;
    this.track = null;
    this.trackConfig = null;
    this.sessionType = null;
    this.sessionTimeRemaining = 0;
    this.currentLap = 0;
    this.totalLaps = 0;
    this.players = [];
    this.maxPlayers = 0;
    this.lastError = null;
    this.startedAt = null;
    this.markUpdated();
  }
}

module.exports = { ServerStatus, ServerState, SessionType };

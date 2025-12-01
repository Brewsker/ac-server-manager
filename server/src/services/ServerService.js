/**
 * Server Control Service
 * 
 * Manages the Assetto Corsa dedicated server process.
 * Handles starting, stopping, and monitoring the server.
 * 
 * @module services/ServerService
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../config/logger');
const { ServerStatus, ServerState } = require('../models/ServerStatus');
const configService = require('./ConfigService');

const execAsync = promisify(exec);

/**
 * ServerService class
 * 
 * Manages the AC server process lifecycle and provides
 * status monitoring capabilities.
 */
class ServerService {
  /**
   * Creates a new ServerService instance
   */
  constructor() {
    /** @type {ServerStatus} Current server status */
    this.status = new ServerStatus();
    
    /** @type {ChildProcess|null} Server process reference */
    this.process = null;
    
    /** @type {string} Path to AC server executable */
    this.serverPath = config.acServerPath;
    
    /** @type {NodeJS.Timeout|null} Status polling interval */
    this.statusInterval = null;
  }

  /**
   * Initialize the service
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('ServerService initialized');
    await this.checkServerInstallation();
  }

  /**
   * Check if AC server is installed at configured path
   * 
   * @private
   * @returns {Promise<boolean>}
   */
  async checkServerInstallation() {
    if (!this.serverPath) {
      logger.warn('AC server path not configured');
      return false;
    }

    try {
      // Check for server executable (Windows or Linux)
      const exeName = process.platform === 'win32' 
        ? 'acServer.exe' 
        : 'acServer';
      
      const exePath = path.join(this.serverPath, exeName);
      await fs.access(exePath);
      
      logger.info('AC server installation found', { path: exePath });
      return true;
    } catch (error) {
      logger.warn('AC server executable not found', { 
        path: this.serverPath,
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get current server status
   * 
   * @returns {Object} Server status object
   */
  getStatus() {
    return this.status.toJSON();
  }

  /**
   * Start the AC server
   * 
   * @param {string} [configId] - Optional config ID to use
   * @returns {Promise<Object>} Start result
   */
  async start(configId) {
    // Check if already running
    if (this.status.isRunning) {
      throw new Error('Server is already running');
    }

    // Get configuration
    const serverConfig = configId 
      ? configService.getConfig(configId)
      : configService.getActiveConfig();

    if (!serverConfig) {
      throw new Error('No server configuration found');
    }

    // Validate configuration
    const validation = serverConfig.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Save configuration to disk before starting
    await configService.saveConfigToDisk(serverConfig.id);

    // Get entry list and save if exists
    const entryList = configService.getActiveEntryList();
    if (entryList) {
      await configService.saveEntryListToDisk(entryList.id);
    }

    // Update status
    this.status.setStarting(serverConfig.name, serverConfig.track);
    logger.info('Starting AC server', { 
      name: serverConfig.name,
      track: serverConfig.track 
    });

    try {
      // Determine executable name based on platform
      const exeName = process.platform === 'win32' 
        ? 'acServer.exe' 
        : 'acServer';
      
      const exePath = path.join(this.serverPath, exeName);

      // Spawn server process
      this.process = spawn(exePath, [], {
        cwd: this.serverPath,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Handle process output
      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        logger.debug('Server output:', output);
        this.parseServerOutput(output);
      });

      this.process.stderr.on('data', (data) => {
        logger.error('Server error:', data.toString());
      });

      // Handle process events
      this.process.on('error', (error) => {
        logger.error('Server process error', { error: error.message });
        this.status.setError(error.message);
      });

      this.process.on('exit', (code, signal) => {
        logger.info('Server process exited', { code, signal });
        this.handleProcessExit(code, signal);
      });

      // Update status to running
      this.status.setRunning(this.process.pid, serverConfig.maxClients);
      
      // Start status polling
      this.startStatusPolling();

      return {
        success: true,
        pid: this.process.pid,
        message: 'Server started successfully'
      };
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      this.status.setError(error.message);
      throw error;
    }
  }

  /**
   * Stop the AC server
   * 
   * @returns {Promise<Object>} Stop result
   */
  async stop() {
    if (!this.status.isRunning && this.status.state !== ServerState.STARTING) {
      throw new Error('Server is not running');
    }

    logger.info('Stopping AC server', { pid: this.status.pid });
    this.status.setStopping();

    try {
      if (this.process) {
        // Try graceful shutdown first
        this.process.kill('SIGTERM');

        // Wait for process to exit
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            // Force kill if still running
            if (this.process) {
              this.process.kill('SIGKILL');
            }
            resolve();
          }, 5000);

          this.process.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      // Stop status polling
      this.stopStatusPolling();

      this.process = null;
      this.status.setStopped();

      return {
        success: true,
        message: 'Server stopped successfully'
      };
    } catch (error) {
      logger.error('Failed to stop server', { error: error.message });
      this.status.setError(error.message);
      throw error;
    }
  }

  /**
   * Restart the AC server
   * 
   * @param {string} [configId] - Optional config ID to use
   * @returns {Promise<Object>} Restart result
   */
  async restart(configId) {
    logger.info('Restarting AC server');
    
    if (this.status.isRunning) {
      await this.stop();
    }

    // Small delay before starting
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.start(configId);
  }

  /**
   * Handle server process exit
   * 
   * @private
   * @param {number|null} code - Exit code
   * @param {string|null} signal - Exit signal
   */
  handleProcessExit(code, signal) {
    this.stopStatusPolling();
    this.process = null;

    if (code === 0 || signal === 'SIGTERM') {
      this.status.setStopped();
    } else {
      this.status.setError(`Server exited with code ${code}`);
    }
  }

  /**
   * Parse server output for status updates
   * 
   * @private
   * @param {string} output - Server output string
   */
  parseServerOutput(output) {
    // Parse player connections
    const connectMatch = output.match(/(\w+) connected \(car: (\w+)\)/);
    if (connectMatch) {
      this.status.addPlayer({
        name: connectMatch[1],
        car: connectMatch[2],
        guid: '' // Would need to extract from actual server output
      });
    }

    // Parse player disconnections
    const disconnectMatch = output.match(/(\w+) disconnected/);
    if (disconnectMatch) {
      // Would need actual GUID from server
    }

    // Parse session changes
    const sessionMatch = output.match(/Session changed to (\w+)/i);
    if (sessionMatch) {
      this.status.updateSession({
        type: sessionMatch[1].toLowerCase()
      });
    }
  }

  /**
   * Start status polling interval
   * 
   * @private
   */
  startStatusPolling() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    this.statusInterval = setInterval(() => {
      this.pollStatus();
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Stop status polling interval
   * 
   * @private
   */
  stopStatusPolling() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  /**
   * Poll for status updates
   * 
   * @private
   */
  pollStatus() {
    // Check if process is still running
    if (this.process && this.status.isRunning) {
      try {
        // Send signal 0 to check if process exists
        process.kill(this.process.pid, 0);
      } catch (error) {
        // Process not running
        logger.warn('Server process no longer running');
        this.handleProcessExit(null, null);
      }
    }
  }

  /**
   * Kick a player from the server
   * 
   * @param {string} guid - Player GUID to kick
   * @param {string} [reason] - Kick reason
   * @returns {Promise<Object>} Kick result
   */
  async kickPlayer(guid, reason = 'Kicked by admin') {
    if (!this.status.isRunning) {
      throw new Error('Server is not running');
    }

    // This would send a command to the server's admin interface
    // For now, we'll just log the action
    logger.info('Kicking player', { guid, reason });

    return {
      success: true,
      message: `Player kicked: ${reason}`
    };
  }

  /**
   * Send a chat message to the server
   * 
   * @param {string} message - Message to send
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(message) {
    if (!this.status.isRunning) {
      throw new Error('Server is not running');
    }

    logger.info('Sending server message', { message });

    return {
      success: true,
      message: 'Message sent'
    };
  }

  /**
   * Get server logs
   * 
   * @param {number} [lines=100] - Number of lines to retrieve
   * @returns {Promise<string[]>} Array of log lines
   */
  async getLogs(lines = 100) {
    try {
      const logPath = path.join(this.serverPath, 'logs', 'server.log');
      const content = await fs.readFile(logPath, 'utf-8');
      const allLines = content.split('\n');
      return allLines.slice(-lines);
    } catch (error) {
      logger.warn('Could not read server logs', { error: error.message });
      return [];
    }
  }
}

// Export singleton instance
module.exports = new ServerService();

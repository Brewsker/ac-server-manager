/**
 * Configuration State Manager
 *
 * Manages three types of configurations:
 * 1. Default Config - Template/baseline (read-only)
 * 2. Working Config - Currently being edited in the UI (in-memory)
 * 3. Active Config - What's written to AC server INI files (on disk)
 * 4. Presets - Saved configurations (on disk)
 */

import * as configService from './configService.js';
import * as serverService from './serverService.js';
import fs from 'fs/promises';
import path from 'path';
import ini from 'ini';

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'data', 'default_config.ini');

// In-memory working configuration (what user is editing)
let workingConfig = null;

/**
 * Get the default configuration template (parsed from INI file with proper types)
 */
export async function getDefaultConfig() {
  try {
    const content = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf-8');
    const parsed = ini.parse(content);

    // Convert string values to proper types based on comprehensive defaults
    const defaults = getComprehensiveDefaults();
    return mergeWithDefaults(parsed, defaults);
  } catch (error) {
    console.error('[ConfigStateManager] Failed to load default config:', error);
    throw new Error('Default configuration not found');
  }
}

/**
 * Get the active configuration (what's in AC server INI files)
 */
export async function getActiveConfig() {
  const config = await configService.getConfig();
  // Ensure proper types
  const defaults = getComprehensiveDefaults();
  return mergeWithDefaults(config, defaults);
}

/**
 * Get comprehensive default configuration
 * These match the frontend "Load Tab Defaults" values
 */
function getComprehensiveDefaults() {
  return {
    SERVER: {
      NAME: 'AC Server',
      TRACK: '',
      CARS: '',
      MAX_CLIENTS: 18,
      PASSWORD: '',
      ADMIN_PASSWORD: 'mypassword',
      UDP_PORT: 9600,
      TCP_PORT: 9600,
      HTTP_PORT: 8081,
      PICKUP_MODE_ENABLED: 0,
      WELCOME_MESSAGE: '',
      CLIENT_SEND_INTERVAL_HZ: 18,
      NUM_THREADS: 2,
      REGISTER_TO_LOBBY: 1,
      CSP_PHYSICS_LEVEL: 0,
      CSP_USE_RAIN_CLOUDS: 0,
      CSP_RAIN_CLOUDS_CONTROL: 0,
      CSP_SHADOWS_STATE: 0,
      CSP_EXTRA_OPTIONS: '',
      ABS_ALLOWED: 1,
      TC_ALLOWED: 1,
      STABILITY_ALLOWED: 0,
      AUTOCLUTCH_ALLOWED: 0,
      TYRE_BLANKETS_ALLOWED: 0,
      FORCE_VIRTUAL_MIRROR: 1,
      FUEL_RATE: 100,
      DAMAGE_MULTIPLIER: 100,
      TYRE_WEAR_RATE: 100,
      ALLOWED_TYRES_OUT: 2,
      START_RULE: 1,
      RACE_GAS_PENALTY_DISABLED: 0,
      KICK_QUORUM: 85,
      VOTING_QUORUM: 80,
      VOTE_DURATION: 20,
      BLACKLIST_MODE: 1,
      MAX_CONTACTS_PER_KM: -1,
      SUN_ANGLE: 960,
      TIME_OF_DAY_MULT: 1,
      LOCKED_ENTRY_LIST: 0,
      LOOP_MODE: 1,
      RACE_OVER_TIME: 180,
      PLUGIN_ADDRESS: '',
      PLUGIN_LOCAL_PORT: '',
      AUTH_PLUGIN_ADDRESS: '',
      USE_CM_AS_PLUGIN: 0,
      WEB_LINK: '',
      LEGAL_TYRES: '',
    },
    DYNAMIC_TRACK: {
      SESSION_START: 95,
      RANDOMNESS: 2,
      SESSION_TRANSFER: 90,
      LAP_GAIN: 10,
    },
    BOOKING: {
      IS_OPEN: 0,
      TIME: 10,
    },
    PRACTICE: {
      IS_OPEN: 1,
      TIME: 10,
      CAN_JOIN: 1,
    },
    QUALIFY: {
      IS_OPEN: 1,
      TIME: 10,
      CAN_JOIN: 1,
      QUALIFY_MAX_WAIT_PERC: 120,
    },
    RACE: {
      IS_OPEN: 1,
      LAPS: 5,
      WAIT_TIME: 60,
      RESULT_SCREEN_TIME: 60,
      RACE_JOIN_TYPE: 0,
      MANDATORY_PIT: 0,
      MANDATORY_PIT_FROM: 0,
      MANDATORY_PIT_TO: 0,
      REVERSED_GRID_RACE_POSITIONS: 0,
    },
    FTP: {
      HOST: '',
      LOGIN: '',
      PASSWORD: '',
      FOLDER: '',
      UPLOAD_DATA_ONLY: 0,
      TARGET: 'windows',
    },
  };
}

/**
 * Get the working configuration (what user is currently editing)
 * If no working config exists, load from active config or defaults
 */
export async function getWorkingConfig() {
  if (!workingConfig) {
    console.log('[ConfigStateManager] No working config, initializing...');

    try {
      // Try to load active server config first (already type-converted)
      workingConfig = await getActiveConfig();
      console.log('[ConfigStateManager] Loaded active server configuration with defaults merged');
    } catch (error) {
      console.warn('[ConfigStateManager] Could not load active config:', error.message);

      // Fallback to default config file (already type-converted)
      try {
        workingConfig = await getDefaultConfig();
        console.log('[ConfigStateManager] Loaded default file configuration');
      } catch (defaultError) {
        console.error('[ConfigStateManager] Could not load default file:', defaultError.message);

        // Use comprehensive defaults
        workingConfig = getComprehensiveDefaults();
        console.log('[ConfigStateManager] Using comprehensive default configuration');
      }
    }
  }
  return workingConfig;
}

/**
 * Merge active config with defaults to ensure all fields exist
 * Also converts string values to proper types (numbers, booleans)
 */
function mergeWithDefaults(config, defaults) {
  const merged = { ...defaults };

  // Merge each section
  Object.keys(defaults).forEach((section) => {
    if (config[section]) {
      merged[section] = {
        ...defaults[section],
        ...config[section],
      };

      // Convert string values to proper types based on defaults
      Object.keys(merged[section]).forEach((key) => {
        const defaultValue = defaults[section][key];
        const configValue = config[section][key];

        if (configValue !== undefined && configValue !== null) {
          // If default is a number, convert string to number
          if (typeof defaultValue === 'number') {
            merged[section][key] = Number(configValue);
          }
          // Keep strings as strings, everything else as-is
        }
      });
    }
  });

  // Also include any sections from config that aren't in defaults
  Object.keys(config).forEach((section) => {
    if (!merged[section]) {
      merged[section] = config[section];
    }
  });

  return merged;
}

/**
 * Update the working configuration (user editing in UI)
 * This does NOT write to disk/INI files
 */
export async function updateWorkingConfig(newConfig) {
  console.log('[ConfigStateManager] Updating working config');
  workingConfig = newConfig;
  return {
    success: true,
    message: 'Working configuration updated (not saved to server yet)',
  };
}

/**
 * Apply working config to active config (write to AC server INI files)
 * If server is running, restart it to apply changes
 */
export async function applyWorkingConfig() {
  if (!workingConfig) {
    throw new Error('No working configuration to apply');
  }

  console.log('[ConfigStateManager] Applying working config to active config...');

  // Check if server is running
  const serverStatus = await serverService.getServerStatus();
  const wasRunning = serverStatus.running;

  // Apply config
  const result = await configService.updateConfig(workingConfig);
  console.log('[ConfigStateManager] Active config updated');

  // Restart server if it was running
  if (wasRunning) {
    console.log('[ConfigStateManager] Server was running, restarting to apply changes...');
    try {
      await serverService.restartServer();
      console.log('[ConfigStateManager] Server restarted successfully');
      return {
        ...result,
        message: 'Configuration applied and server restarted',
        serverRestarted: true,
      };
    } catch (error) {
      console.error('[ConfigStateManager] Failed to restart server:', error);
      return {
        ...result,
        message: 'Configuration applied but server restart failed',
        serverRestarted: false,
        restartError: error.message,
      };
    }
  }

  return {
    ...result,
    message: 'Configuration applied to server',
    serverRestarted: false,
  };
}

/**
 * Load a preset into working config
 */
export async function loadPresetToWorking(presetConfig) {
  console.log('[ConfigStateManager] Loading preset to working config');
  workingConfig = presetConfig;
  return {
    success: true,
    message: 'Preset loaded to editor',
  };
}

/**
 * Load default config into working config
 */
export async function loadDefaultToWorking() {
  console.log('[ConfigStateManager] Loading default config to working config');
  workingConfig = await getDefaultConfig();
  return {
    success: true,
    message: 'Default configuration loaded',
  };
}

/**
 * Load active server config into working config
 */
export async function loadActiveToWorking() {
  console.log('[ConfigStateManager] Loading active server config to working config');
  workingConfig = await getActiveConfig();
  return {
    success: true,
    message: 'Active server configuration loaded',
  };
}

/**
 * Reset working config (clear in-memory state)
 */
export async function resetWorkingConfig() {
  console.log('[ConfigStateManager] Resetting working config');
  workingConfig = null;
  return {
    success: true,
    message: 'Working configuration reset',
  };
}

/**
 * Get current state metadata
 */
export function getStateInfo() {
  return {
    hasWorkingConfig: workingConfig !== null,
    workingConfigName: workingConfig?.SERVER?.NAME || null,
  };
}

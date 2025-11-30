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
import fs from 'fs/promises';
import path from 'path';
import ini from 'ini';

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'data', 'default_config.ini');

// In-memory working configuration (what user is editing)
let workingConfig = null;

/**
 * Get the default configuration template
 */
export async function getDefaultConfig() {
  try {
    const content = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf-8');
    return ini.parse(content);
  } catch (error) {
    console.error('[ConfigStateManager] Failed to load default config:', error);
    throw new Error('Default configuration not found');
  }
}

/**
 * Get the active configuration (what's in AC server INI files)
 */
export async function getActiveConfig() {
  return await configService.getConfig();
}

/**
 * Get the working configuration (what user is currently editing)
 * If no working config exists, load from active config
 */
export async function getWorkingConfig() {
  if (!workingConfig) {
    console.log('[ConfigStateManager] No working config, loading from active config...');
    workingConfig = await getActiveConfig();
  }
  return workingConfig;
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
    message: 'Working configuration updated (not saved to server yet)'
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
  const { getServerStatus, restartServer } = await import('./serverService.js');
  const serverStatus = await getServerStatus();
  const wasRunning = serverStatus.running;
  
  // Apply config
  const result = await configService.updateConfig(workingConfig);
  console.log('[ConfigStateManager] Active config updated');
  
  // Restart server if it was running
  if (wasRunning) {
    console.log('[ConfigStateManager] Server was running, restarting to apply changes...');
    try {
      await restartServer();
      console.log('[ConfigStateManager] Server restarted successfully');
      return {
        ...result,
        message: 'Configuration applied and server restarted',
        serverRestarted: true
      };
    } catch (error) {
      console.error('[ConfigStateManager] Failed to restart server:', error);
      return {
        ...result,
        message: 'Configuration applied but server restart failed',
        serverRestarted: false,
        restartError: error.message
      };
    }
  }
  
  return {
    ...result,
    message: 'Configuration applied to server',
    serverRestarted: false
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
    message: 'Preset loaded to editor'
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
    message: 'Default configuration loaded'
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
    message: 'Active server configuration loaded'
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
    message: 'Working configuration reset'
  };
}

/**
 * Get current state metadata
 */
export function getStateInfo() {
  return {
    hasWorkingConfig: workingConfig !== null,
    workingConfigName: workingConfig?.SERVER?.NAME || null
  };
}

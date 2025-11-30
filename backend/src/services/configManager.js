/**
 * Configuration Manager
 * 
 * Centralized service to manage the "current working configuration"
 * Provides a single source of truth for config state
 */

import * as configService from './configService.js';

// In-memory cache of current config
let currentConfig = null;
let lastModified = null;

/**
 * Get the current working configuration
 * Always reads from disk to ensure accuracy
 */
export async function getCurrentConfig() {
  console.log('[configManager] getCurrentConfig() called');
  currentConfig = await configService.getConfig();
  lastModified = new Date().toISOString();
  console.log('[configManager] Config loaded, server name:', currentConfig?.SERVER?.NAME);
  return {
    config: currentConfig,
    lastModified
  };
}

/**
 * Update the current working configuration
 * Writes to disk and updates cache
 */
export async function updateCurrentConfig(newConfig) {
  const result = await configService.updateConfig(newConfig);
  currentConfig = newConfig;
  lastModified = new Date().toISOString();
  return {
    ...result,
    lastModified
  };
}

/**
 * Load a preset as the current configuration
 * This is what happens when you click "Load" or "Edit"
 */
export async function loadPresetAsCurrentConfig(presetConfig) {
  console.log('[configManager] loadPresetAsCurrentConfig() called');
  console.log('[configManager] Preset server name:', presetConfig?.SERVER?.NAME);
  
  // Write the preset config to the actual server config files
  const result = await configService.updateConfig(presetConfig);
  currentConfig = presetConfig;
  lastModified = new Date().toISOString();
  
  console.log('[configManager] Config written to disk and cache updated');
  return {
    ...result,
    lastModified
  };
}

/**
 * Get metadata about current config state
 */
export function getConfigMetadata() {
  return {
    hasConfig: currentConfig !== null,
    lastModified
  };
}

/**
 * Force refresh from disk
 */
export async function refreshConfig() {
  return await getCurrentConfig();
}

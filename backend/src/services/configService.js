import ini from 'ini';
import fs from 'fs/promises';
import path from 'path';

/**
 * Get current server configuration
 */
export async function getConfig() {
  const configPath = process.env.AC_SERVER_CONFIG_PATH;
  if (!configPath) {
    throw new Error('AC_SERVER_CONFIG_PATH not configured in .env');
  }

  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = ini.parse(configContent);
    
    // Convert string values to proper types
    // INI parser returns everything as strings, but we need numbers for checkboxes/sliders
    return normalizeConfigTypes(config);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Server config file not found');
    }
    throw error;
  }
}

/**
 * Convert INI string values to proper JavaScript types
 */
function normalizeConfigTypes(config) {
  const normalized = {};
  
  for (const section in config) {
    normalized[section] = {};
    
    for (const key in config[section]) {
      const value = config[section][key];
      
      // Skip if undefined or null
      if (value === undefined || value === null) {
        normalized[section][key] = value;
        continue;
      }
      
      // If it's already not a string, keep it
      if (typeof value !== 'string') {
        normalized[section][key] = value;
        continue;
      }
      
      // Try to convert to number if it looks like one
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        normalized[section][key] = Number(value);
      } else {
        // Keep as string
        normalized[section][key] = value;
      }
    }
  }
  
  return normalized;
}

/**
 * Update server configuration
 */
export async function updateConfig(newConfig) {
  const configPath = process.env.AC_SERVER_CONFIG_PATH;
  if (!configPath) {
    throw new Error('AC_SERVER_CONFIG_PATH not configured in .env');
  }

  // Ensure lobby registration is disabled by default (prevents auto-shutdown)
  if (newConfig.SERVER && newConfig.SERVER.REGISTER_TO_LOBBY === undefined) {
    newConfig.SERVER.REGISTER_TO_LOBBY = 0;
  }

  // Convert CARS to proper semicolon-separated format (not array)
  let selectedCars = [];
  if (newConfig.SERVER && newConfig.SERVER.CARS) {
    if (Array.isArray(newConfig.SERVER.CARS)) {
      selectedCars = newConfig.SERVER.CARS;
      // Store as simple string, not array - prevents INI library from formatting as JSON
      newConfig.SERVER.CARS = newConfig.SERVER.CARS.join(';');
    } else if (typeof newConfig.SERVER.CARS === 'string') {
      selectedCars = newConfig.SERVER.CARS.split(';').filter(c => c.trim());
    }
  }

  // Remove problematic fields that cause issues with official content
  // LEGAL_TYRES causes "illegal car" errors with encrypted data.acd files
  // CONFIG_TRACK can also cause issues if set incorrectly
  if (newConfig.SERVER) {
    delete newConfig.SERVER.LEGAL_TYRES;
    if (!newConfig.SERVER.CONFIG_TRACK || newConfig.SERVER.CONFIG_TRACK === '') {
      delete newConfig.SERVER.CONFIG_TRACK;
    }
  }

  // Write INI file with custom handling for CARS field
  let configString = ini.stringify(newConfig);
  
  // Fix CARS format - the ini library escapes semicolons with backslashes
  // Replace: CARS=car1\;car2\; with CARS=car1;car2;
  configString = configString.replace(/^CARS=(.*)$/gm, (match, cars) => {
    // Remove backslash escaping from semicolons
    const unescaped = cars.replace(/\\\;/g, ';');
    return `CARS=${unescaped}`;
  });
  
  // Also handle if ini library converted to JSON array format
  configString = configString.replace(
    /^CARS=\[.*?\]$/gm,
    `CARS=${selectedCars.join(';')}`
  );

  await fs.writeFile(configPath, configString, 'utf-8');

  // Update entry_list.ini to match selected cars
  if (selectedCars.length > 0) {
    await updateEntryListForCars(selectedCars);
  }

  return {
    success: true,
    message: 'Configuration updated',
    timestamp: new Date().toISOString()
  };
}

/**
 * Update entry_list.ini to match selected cars
 * @private
 */
async function updateEntryListForCars(cars) {
  const entryListPath = process.env.AC_ENTRY_LIST_PATH;
  if (!entryListPath) {
    return; // Skip if not configured
  }

  try {
    // Read existing entry list
    let entries = {};
    try {
      const entryContent = await fs.readFile(entryListPath, 'utf-8');
      entries = ini.parse(entryContent);
    } catch (error) {
      // File doesn't exist or empty, start fresh
    }

    // Get current entries and their car models
    const existingEntries = Object.keys(entries)
      .filter(key => key.startsWith('CAR_'))
      .map(key => ({ id: key, model: entries[key].MODEL }));

    // Update existing entries to use selected cars (round-robin)
    let carIndex = 0;
    for (const entry of existingEntries) {
      if (entries[entry.id]) {
        entries[entry.id].MODEL = cars[carIndex % cars.length];
        carIndex++;
      }
    }

    // Write back
    const entryString = ini.stringify(entries);
    await fs.writeFile(entryListPath, entryString, 'utf-8');
  } catch (error) {
    console.error('Failed to update entry list:', error);
    // Don't throw - entry list update is optional
  }
}

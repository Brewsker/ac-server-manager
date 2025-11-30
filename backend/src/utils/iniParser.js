import ini from 'ini';
import fs from 'fs/promises';

/**
 * Parse INI file to JavaScript object
 * @param {string} filePath - Path to INI file
 * @returns {Promise<Object>} Parsed INI data
 */
export async function parseIniFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return ini.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse INI file: ${error.message}`);
  }
}

/**
 * Write JavaScript object to INI file
 * @param {string} filePath - Path to INI file
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeIniFile(filePath, data) {
  try {
    const content = ini.stringify(data);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write INI file: ${error.message}`);
  }
}

/**
 * Validate server config structure
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
export function validateServerConfig(config) {
  const errors = [];
  const required = ['SERVER', 'PRACTICE', 'RACE'];

  for (const section of required) {
    if (!config[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Validate specific fields
  if (config.SERVER) {
    if (!config.SERVER.NAME) {
      errors.push('Server name is required');
    }
    if (!config.SERVER.TRACK) {
      errors.push('Track is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

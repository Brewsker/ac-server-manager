import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if required AC paths are configured
 * Reads directly from .env file to get latest values
 */
export async function isConfigured() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const requiredVars = [
      'AC_SERVER_PATH',
      'AC_SERVER_CONFIG_PATH',
      'AC_ENTRY_LIST_PATH',
      'AC_CONTENT_PATH'
    ];

    // Check each required variable has a value in the .env file
    return requiredVars.every(varName => {
      const regex = new RegExp(`^${varName}=(.+)$`, 'm');
      const match = envContent.match(regex);
      return match && match[1].trim().length > 0;
    });
  } catch (error) {
    return false;
  }
}

/**
 * Validate that AC installation paths exist
 */
export async function validatePaths(acInstallDir) {
  const normalizedPath = acInstallDir.replace(/\\/g, '/');
  
  const paths = {
    serverExe: path.join(acInstallDir, 'server', 'acServer.exe'),
    serverCfg: path.join(acInstallDir, 'server', 'cfg', 'server_cfg.ini'),
    entryList: path.join(acInstallDir, 'server', 'cfg', 'entry_list.ini'),
    content: path.join(acInstallDir, 'content')
  };

  const validation = {
    valid: true,
    errors: [],
    paths: {}
  };

  // Check server executable
  try {
    await fs.access(paths.serverExe);
    validation.paths.AC_SERVER_PATH = paths.serverExe.replace(/\\/g, '/');
  } catch {
    validation.valid = false;
    validation.errors.push('AC server executable not found at: ' + paths.serverExe);
  }

  // Check server config
  try {
    await fs.access(paths.serverCfg);
    validation.paths.AC_SERVER_CONFIG_PATH = paths.serverCfg.replace(/\\/g, '/');
  } catch {
    validation.valid = false;
    validation.errors.push('server_cfg.ini not found at: ' + paths.serverCfg);
  }

  // Check entry list
  try {
    await fs.access(paths.entryList);
    validation.paths.AC_ENTRY_LIST_PATH = paths.entryList.replace(/\\/g, '/');
  } catch {
    validation.valid = false;
    validation.errors.push('entry_list.ini not found at: ' + paths.entryList);
  }

  // Check content folder
  try {
    const stats = await fs.stat(paths.content);
    if (stats.isDirectory()) {
      validation.paths.AC_CONTENT_PATH = paths.content.replace(/\\/g, '/');
    } else {
      validation.valid = false;
      validation.errors.push('Content path is not a directory: ' + paths.content);
    }
  } catch {
    validation.valid = false;
    validation.errors.push('Content folder not found at: ' + paths.content);
  }

  return validation;
}

/**
 * Update .env file with new paths
 */
export async function updateEnvFile(paths) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  
  try {
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Update each path
    for (const [key, value] of Object.entries(paths)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add if doesn't exist
        envContent += `\n${key}=${value}`;
      }
    }

    await fs.writeFile(envPath, envContent, 'utf-8');
    return { success: true, message: 'Configuration saved successfully' };
  } catch (error) {
    throw new Error(`Failed to update .env file: ${error.message}`);
  }
}

/**
 * Auto-detect AC installation directory
 * Checks common Steam library locations
 */
export async function autoDetectACInstall() {
  const commonPaths = [
    'C:/Program Files (x86)/Steam/steamapps/common/assettocorsa',
    'C:/Steam/steamapps/common/assettocorsa',
    'D:/Steam/steamapps/common/assettocorsa',
    'D:/SteamLibrary/steamapps/common/assettocorsa',
    'E:/Steam/steamapps/common/assettocorsa',
    'E:/SteamLibrary/steamapps/common/assettocorsa',
    'F:/Steam/steamapps/common/assettocorsa',
    'F:/SteamLibrary/steamapps/common/assettocorsa',
    'G:/Steam/steamapps/common/assettocorsa',
    'G:/SteamLibrary/steamapps/common/assettocorsa'
  ];

  for (const testPath of commonPaths) {
    try {
      const serverExe = path.join(testPath, 'server', 'acServer.exe');
      await fs.access(serverExe);
      return testPath;
    } catch {
      // Continue to next path
    }
  }

  return null;
}

/**
 * Get setup status and suggestions
 */
export async function getSetupStatus() {
  const configured = await isConfigured();
  
  if (configured) {
    return {
      configured: true,
      message: 'AC Server Manager is configured and ready to use'
    };
  }

  const autoDetected = await autoDetectACInstall();
  
  return {
    configured: false,
    message: 'AC Server Manager needs to be configured',
    autoDetected: autoDetected,
    suggestion: autoDetected 
      ? `AC installation auto-detected at: ${autoDetected}`
      : 'Please provide your AC installation directory'
  };
}

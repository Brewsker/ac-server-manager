import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Download Assetto Corsa Dedicated Server via SteamCMD
 * @param {string} installPath - Where to install AC server
 * @param {string} steamUser - Steam username (can be 'anonymous')
 * @param {string} steamPass - Steam password (empty for anonymous)
 * @returns {Promise<Object>} Download status and info
 */
export async function downloadACServer(installPath, steamUser = 'anonymous', steamPass = '') {
  try {
    // Validate SteamCMD is installed
    try {
      await execAsync('which steamcmd');
    } catch (error) {
      throw new Error(
        'SteamCMD not found. Please install it first: sudo apt-get install steamcmd'
      );
    }

    // Create install directory
    await fs.mkdir(installPath, { recursive: true });

    // Create SteamCMD script
    const scriptPath = '/tmp/install_ac.txt';
    const scriptContent = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
force_install_dir ${installPath}
login ${steamUser} ${steamPass}
app_update 302550 validate
quit
`;

    await fs.writeFile(scriptPath, scriptContent);

    // Run SteamCMD
    console.log('[SteamService] Starting AC server download...');
    const { stdout, stderr } = await execAsync(`steamcmd +runscript ${scriptPath}`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
    });

    // Clean up script
    await fs.unlink(scriptPath);

    // Verify installation
    const acServerPath = path.join(installPath, 'acServer');
    try {
      await fs.access(acServerPath);
      await fs.chmod(acServerPath, 0o755); // Make executable

      // Try to get version
      let version = 'Unknown';
      try {
        const { stdout: versionOutput } = await execAsync(`${acServerPath} -v 2>&1 | head -n1`);
        version = versionOutput.trim();
      } catch (error) {
        console.warn('[SteamService] Could not get AC server version:', error.message);
      }

      return {
        success: true,
        message: 'AC Dedicated Server downloaded successfully',
        path: installPath,
        version,
        output: stdout,
      };
    } catch (error) {
      throw new Error(
        `AC server download completed but acServer executable not found at ${acServerPath}`
      );
    }
  } catch (error) {
    console.error('[SteamService] Failed to download AC server:', error);
    throw error;
  }
}

/**
 * Check if SteamCMD is installed
 * @returns {Promise<boolean>}
 */
export async function isSteamCMDInstalled() {
  try {
    await execAsync('which steamcmd');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Install SteamCMD (requires sudo)
 * @returns {Promise<Object>}
 */
export async function installSteamCMD() {
  try {
    console.log('[SteamService] Installing SteamCMD...');

    // Add multiverse repository (needed for steamcmd)
    await execAsync('sudo add-apt-repository multiverse -y');
    await execAsync('sudo dpkg --add-architecture i386');
    await execAsync('sudo apt-get update');

    // Accept Steam license
    await execAsync(
      'echo steam steam/question select "I AGREE" | sudo debconf-set-selections'
    );
    await execAsync(
      'echo steam steam/license note "" | sudo debconf-set-selections'
    );

    // Install SteamCMD
    await execAsync('sudo apt-get install -y steamcmd');

    return {
      success: true,
      message: 'SteamCMD installed successfully',
    };
  } catch (error) {
    console.error('[SteamService] Failed to install SteamCMD:', error);
    throw new Error(`Failed to install SteamCMD: ${error.message}`);
  }
}

/**
 * Check if AC server is installed at given path
 * @param {string} installPath
 * @returns {Promise<Object>}
 */
export async function checkACServerInstalled(installPath) {
  try {
    const acServerPath = path.join(installPath, 'acServer');
    await fs.access(acServerPath);

    // Try to get version
    let version = 'Unknown';
    try {
      const { stdout } = await execAsync(`${acServerPath} -v 2>&1 | head -n1`);
      version = stdout.trim();
    } catch (error) {
      console.warn('[SteamService] Could not get AC server version:', error.message);
    }

    return {
      installed: true,
      path: installPath,
      version,
    };
  } catch (error) {
    return {
      installed: false,
      path: installPath,
    };
  }
}

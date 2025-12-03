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
    // Find SteamCMD binary
    let steamcmdPath = '/usr/games/steamcmd';
    try {
      const { stdout } = await execAsync('which steamcmd');
      steamcmdPath = stdout.trim();
    } catch (error) {
      // Check alternate locations
      const altPaths = ['/usr/lib/games/steam/steamcmd', '/usr/games/steamcmd'];
      let found = false;
      for (const testPath of altPaths) {
        try {
          await fs.access(testPath);
          steamcmdPath = testPath;
          found = true;
          break;
        } catch (e) {
          // Continue checking
        }
      }
      if (!found) {
        throw new Error(
          'SteamCMD not found. Please install it first: sudo apt-get install steamcmd'
        );
      }
    }

    console.log(`[SteamService] Using steamcmd at: ${steamcmdPath}`);

    // First, run steamcmd to ensure it's updated (fixes steamconsole.so errors)
    console.log('[SteamService] Initializing SteamCMD (first-time setup)...');
    try {
      await execAsync(`${steamcmdPath} +quit`, { timeout: 60000 });
    } catch (error) {
      console.warn('[SteamService] SteamCMD initialization warning (may be normal):', error.message);
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
    const { stdout, stderr } = await execAsync(`${steamcmdPath} +runscript ${scriptPath}`, {
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
    // Try which command first
    await execAsync('which steamcmd');
    return true;
  } catch (error) {
    // Check alternate locations
    const altPaths = ['/usr/lib/games/steam/steamcmd', '/usr/games/steamcmd'];
    for (const testPath of altPaths) {
      try {
        await fs.access(testPath);
        return true;
      } catch (e) {
        // Continue checking
      }
    }
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

/**
 * Check if AC server cache exists on git-cache server
 * @param {string} cacheHost - IP address of git-cache server (default: 192.168.1.70)
 * @returns {Promise<Object>} Cache status with size and file count
 */
export async function checkACServerCache(cacheHost = '192.168.1.70') {
  try {
    const cachePath = '/opt/steam-cache/ac-dedicated-server';
    
    // Check if cache directory exists and has acServer binary
    const { stdout: checkOutput } = await execAsync(
      `ssh -o ConnectTimeout=5 root@${cacheHost} "test -f ${cachePath}/acServer && echo exists || echo missing"`
    );

    if (checkOutput.trim() !== 'exists') {
      return {
        exists: false,
        path: cachePath,
        host: cacheHost,
      };
    }

    // Get cache size and file count
    const { stdout: sizeOutput } = await execAsync(
      `ssh root@${cacheHost} "du -sh ${cachePath} && find ${cachePath} -type f | wc -l"`
    );

    const lines = sizeOutput.trim().split('\n');
    const size = lines[0].split('\t')[0];
    const fileCount = parseInt(lines[1]);

    return {
      exists: true,
      path: cachePath,
      host: cacheHost,
      size,
      fileCount,
    };
  } catch (error) {
    console.error('[SteamService] Failed to check AC server cache:', error);
    return {
      exists: false,
      error: error.message,
    };
  }
}

/**
 * Copy AC server from git-cache to local install path
 * @param {string} installPath - Where to install AC server locally
 * @param {string} cacheHost - IP address of git-cache server (default: 192.168.1.70)
 * @returns {Promise<Object>} Copy status and info
 */
export async function copyACServerFromCache(installPath, cacheHost = '192.168.1.70') {
  try {
    console.log(`[SteamService] Copying AC server from cache ${cacheHost} to ${installPath}...`);

    // Create install directory
    await fs.mkdir(installPath, { recursive: true });

    const cachePath = '/opt/steam-cache/ac-dedicated-server/';
    
    // Use rsync to copy from cache
    const { stdout, stderr } = await execAsync(
      `rsync -avz --progress root@${cacheHost}:${cachePath} ${installPath}/`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for output
      }
    );

    console.log('[SteamService] Rsync output:', stdout);

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
        message: 'AC Dedicated Server copied from cache successfully',
        path: installPath,
        version,
        output: stdout,
      };
    } catch (error) {
      throw new Error(
        `AC server copy completed but acServer executable not found at ${acServerPath}`
      );
    }
  } catch (error) {
    console.error('[SteamService] Failed to copy AC server from cache:', error);
    throw error;
  }
}

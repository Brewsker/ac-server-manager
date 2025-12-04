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
 * @param {string} steamGuardCode - Steam Guard code (if enabled)
 * @returns {Promise<Object>} Download status and info
 */
export async function downloadACServer(
  installPath,
  steamUser = 'anonymous',
  steamPass = '',
  steamGuardCode = ''
) {
  try {
    // Find SteamCMD binary
    let steamcmdPath = '/usr/games/steamcmd';
    try {
      const { stdout } = await execAsync('which steamcmd');
      steamcmdPath = stdout.trim();
    } catch (error) {
      // Check alternate locations - prefer package version
      const altPaths = ['/usr/games/steamcmd', '/usr/lib/games/steam/steamcmd'];
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

    // Create install directory
    await fs.mkdir(installPath, { recursive: true });

    // Create SteamCMD script
    const scriptPath = '/tmp/install_ac.txt';
    // NOTE: SteamCMD scripts are NOT shell scripts - they're read directly by SteamCMD
    // Do NOT escape the password or it will be interpreted literally with backslashes
    let scriptContent = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
force_install_dir ${installPath}
login ${steamUser} ${steamPass}`;

    // Add Steam Guard code if provided
    if (steamGuardCode && steamGuardCode.trim()) {
      scriptContent += ` ${steamGuardCode.trim()}`;
    }

    scriptContent += `
app_update 302550 validate
quit
`;

    await fs.writeFile(scriptPath, scriptContent);

    // Run SteamCMD
    console.log('[SteamService] Starting AC server download...');
    const { stdout, stderr } = await execAsync(`${steamcmdPath} +runscript ${scriptPath}`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      timeout: 600000, // 10 minute timeout for large downloads
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

    // Check for common error patterns
    const errorOutput = error.stdout || error.message || '';
    const errorStderr = error.stderr || '';
    const fullError = errorOutput + '\n' + errorStderr;

    if (fullError.includes('No subscription')) {
      throw new Error(
        'Steam account does not own Assetto Corsa. You must own the game to download the dedicated server.'
      );
    }
    if (fullError.includes('steamconsole.so')) {
      throw new Error('SteamCMD initialization failed. Please try again or contact support.');
    }
    if (
      fullError.includes('Two-factor') ||
      fullError.includes('Steam Guard') ||
      fullError.includes('GUARD')
    ) {
      // Extract the actual error for better debugging
      const steamOutput = errorOutput.substring(0, 1000);
      throw new Error(
        `🔐 Steam Guard Issue: ${
          steamOutput.includes('Invalid Password')
            ? 'Invalid credentials or expired Steam Guard code. '
            : ''
        }Please verify:\n1. Password is correct (use eye icon to check)\n2. Steam Guard code is current (refreshes every 30s)\n3. You're using the RIGHT type of code (email vs mobile app)\n\nSteam said: ${errorOutput.substring(
          errorOutput.lastIndexOf('Logging in'),
          errorOutput.lastIndexOf('Logging in') + 200
        )}`
      );
    }
    if (
      fullError.includes('Login Failure') ||
      fullError.includes('Invalid Password') ||
      error.code === 5
    ) {
      // Check if it might be Steam Guard related even if not explicitly mentioned
      if (!steamGuardCode || steamGuardCode.trim() === '') {
        throw new Error(
          `❌ Steam Login Failed: Invalid password or Steam Guard required.\n\nPlease:\n1. Verify your password is correct (use the eye icon)\n2. If you have Steam Guard enabled, enter your current code and try again`
        );
      }
      throw new Error(
        `❌ Steam Login Failed: Credentials rejected.\n\nPossible issues:\n1. Password is incorrect\n2. Steam Guard code expired (get a fresh one)\n3. Wrong type of Steam Guard code (email vs mobile)\n\nSteam output: ${errorOutput.substring(
          0,
          500
        )}`
      );
    }

    // Return detailed error for debugging
    throw new Error(
      `SteamCMD failed (code ${error.code || 'unknown'}): ${errorOutput.substring(0, 500)}`
    );
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
 * Works on Debian (no multiverse repo) and Ubuntu
 * @returns {Promise<Object>}
 */
export async function installSteamCMD() {
  try {
    console.log('[SteamService] Installing SteamCMD...');

    // Add i386 architecture (required for SteamCMD)
    await execAsync('sudo dpkg --add-architecture i386');
    await execAsync('sudo apt-get update');

    // Accept Steam license non-interactively
    await execAsync('echo steam steam/question select "I AGREE" | sudo debconf-set-selections');
    await execAsync('echo steam steam/license note "" | sudo debconf-set-selections');

    // Install SteamCMD and required 32-bit libs
    // Note: On Debian, steamcmd is in main repo (contrib/non-free may be needed)
    // On Ubuntu, it's in multiverse - but we skip add-apt-repository as it may not exist
    await execAsync(
      'sudo apt-get install -y steamcmd lib32gcc-s1 || sudo apt-get install -y steamcmd lib32gcc1'
    );

    // Initialize SteamCMD to create required directories
    console.log('[SteamService] Initializing SteamCMD...');
    await execAsync('/usr/games/steamcmd +quit || true');

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

/**
 * Download Assetto Corsa base game via SteamCMD (for content extraction)
 * @param {string} installPath - Where to install AC game (temporary location)
 * @param {string} steamUser - Steam username
 * @param {string} steamPass - Steam password
 * @param {string} steamGuardCode - Steam Guard code (if enabled)
 * @returns {Promise<Object>} Download status and info
 */
export async function downloadACBaseGame(installPath, steamUser, steamPass, steamGuardCode = '') {
  try {
    // Find SteamCMD binary
    let steamcmdPath = '/usr/games/steamcmd';
    try {
      const { stdout } = await execAsync('which steamcmd');
      steamcmdPath = stdout.trim();
    } catch (error) {
      const altPaths = ['/usr/games/steamcmd', '/usr/lib/games/steam/steamcmd'];
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

    console.log(`[SteamService] Downloading AC base game (App ID 244210) to: ${installPath}`);

    // Create install directory
    await fs.mkdir(installPath, { recursive: true });

    // Create SteamCMD script for base game (App ID 244210)
    const scriptPath = '/tmp/install_ac_basegame.txt';
    // NOTE: SteamCMD scripts are NOT shell scripts - they're read directly by SteamCMD
    // Do NOT escape the password or it will be interpreted literally with backslashes
    let scriptContent = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
force_install_dir ${installPath}
login ${steamUser} ${steamPass}`;

    if (steamGuardCode && steamGuardCode.trim()) {
      scriptContent += ` ${steamGuardCode.trim()}`;
    }

    scriptContent += `
app_update 244210 validate
quit
`;

    await fs.writeFile(scriptPath, scriptContent);

    // Run SteamCMD
    console.log('[SteamService] Starting AC base game download (~12GB, may take 10-30 minutes)...');
    const { stdout, stderr } = await execAsync(`${steamcmdPath} +runscript ${scriptPath}`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      timeout: 1800000, // 30 minute timeout for large download
    });

    // Clean up script
    await fs.unlink(scriptPath);

    // Verify installation - check for content folder
    const contentPath = path.join(installPath, 'content');
    const carsPath = path.join(contentPath, 'cars');
    const tracksPath = path.join(contentPath, 'tracks');

    try {
      await fs.access(contentPath);
      await fs.access(carsPath);
      await fs.access(tracksPath);

      // Count files to verify content
      const { stdout: carCount } = await execAsync(`find ${carsPath} -type d -maxdepth 1 | wc -l`);
      const { stdout: trackCount } = await execAsync(
        `find ${tracksPath} -type d -maxdepth 1 | wc -l`
      );

      return {
        success: true,
        message: 'AC base game downloaded successfully',
        path: installPath,
        contentPath,
        carCount: parseInt(carCount.trim()) - 1, // Subtract 1 for parent directory
        trackCount: parseInt(trackCount.trim()) - 1,
        output: stdout,
      };
    } catch (error) {
      throw new Error(`AC game download completed but content folder not found at ${contentPath}`);
    }
  } catch (error) {
    console.error('[SteamService] Failed to download AC base game:', error);

    // Reuse error handling from downloadACServer
    const errorOutput = error.stdout || error.message || '';
    const errorStderr = error.stderr || '';
    const fullError = errorOutput + '\n' + errorStderr;

    if (fullError.includes('No subscription')) {
      throw new Error(
        'Steam account does not own Assetto Corsa. You must purchase the game to download content.'
      );
    }
    if (fullError.includes('steamconsole.so')) {
      throw new Error('SteamCMD initialization failed. Please try again or contact support.');
    }
    if (
      fullError.includes('Two-factor') ||
      fullError.includes('Steam Guard') ||
      fullError.includes('GUARD')
    ) {
      throw new Error(
        `🔐 Steam Guard Issue: Please verify your Steam Guard code is current (refreshes every 30s)`
      );
    }
    if (
      fullError.includes('Login Failure') ||
      fullError.includes('Invalid Password') ||
      error.code === 5
    ) {
      throw new Error(`❌ Steam Login Failed: Invalid credentials or expired Steam Guard code`);
    }

    throw new Error(`SteamCMD failed to download AC base game: ${errorOutput.substring(0, 500)}`);
  }
}

/**
 * Extract content from AC base game to AC server installation
 * @param {string} gameInstallPath - Path where AC base game is installed (e.g., /tmp/ac-basegame)
 * @param {string} serverContentPath - Path to AC server content folder (e.g., /opt/acserver/content)
 * @returns {Promise<Object>} Extraction status
 */
export async function extractACContent(gameInstallPath, serverContentPath) {
  try {
    console.log(
      `[SteamService] Extracting content from ${gameInstallPath} to ${serverContentPath}...`
    );

    // SteamCMD installs to different paths depending on state
    // Try common locations for AC content
    const possiblePaths = [
      path.join(gameInstallPath, 'steamapps', 'common', 'assettocorsa', 'content'),
      path.join(gameInstallPath, 'steamapps', 'downloading', '244210', 'content'),
      path.join(gameInstallPath, 'content'),
    ];

    let contentBasePath = null;
    for (const p of possiblePaths) {
      try {
        await fs.access(path.join(p, 'cars'));
        contentBasePath = p;
        console.log(`[SteamService] Found content at: ${contentBasePath}`);
        break;
      } catch {
        // Try next path
      }
    }

    if (!contentBasePath) {
      throw new Error(
        `Could not find AC content in ${gameInstallPath}. Tried: ${possiblePaths.join(', ')}`
      );
    }

    const gameCarsPath = path.join(contentBasePath, 'cars');
    const gameTracksPath = path.join(contentBasePath, 'tracks');
    const serverCarsPath = path.join(serverContentPath, 'cars');
    const serverTracksPath = path.join(serverContentPath, 'tracks');

    // Verify source paths exist
    await fs.access(gameCarsPath);
    await fs.access(gameTracksPath);

    // Create server content directories
    await fs.mkdir(serverCarsPath, { recursive: true });
    await fs.mkdir(serverTracksPath, { recursive: true });

    console.log('[SteamService] Copying cars...');
    await execAsync(`rsync -av "${gameCarsPath}/" "${serverCarsPath}/"`, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 600000, // 10 minute timeout for large copies
    });

    console.log('[SteamService] Copying tracks...');
    await execAsync(`rsync -av "${gameTracksPath}/" "${serverTracksPath}/"`, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 600000,
    });

    // Count extracted content
    const { stdout: carCount } = await execAsync(
      `find "${serverCarsPath}" -maxdepth 1 -type d | wc -l`
    );
    const { stdout: trackCount } = await execAsync(
      `find "${serverTracksPath}" -maxdepth 1 -type d | wc -l`
    );

    return {
      success: true,
      message: 'Content extracted successfully',
      carCount: parseInt(carCount.trim()) - 1,
      trackCount: parseInt(trackCount.trim()) - 1,
    };
  } catch (error) {
    console.error('[SteamService] Failed to extract content:', error);
    throw new Error(`Failed to extract content: ${error.message}`);
  }
}

/**
 * Remove AC base game files after content extraction
 * @param {string} gameInstallPath - Path where AC base game is installed
 * @returns {Promise<Object>} Cleanup status
 */
export async function cleanupACBaseGame(gameInstallPath) {
  try {
    console.log(`[SteamService] Removing AC base game files from ${gameInstallPath}...`);

    // Safety check - don't delete if path looks suspicious
    if (gameInstallPath === '/' || gameInstallPath === '/opt' || gameInstallPath.length < 5) {
      throw new Error(`Refusing to delete suspicious path: ${gameInstallPath}`);
    }

    // Get size before deletion
    const { stdout: sizeOutput } = await execAsync(`du -sh ${gameInstallPath}`);
    const size = sizeOutput.split('\t')[0];

    // Remove directory
    await fs.rm(gameInstallPath, { recursive: true, force: true });

    console.log(`[SteamService] Cleaned up ${size} from ${gameInstallPath}`);

    return {
      success: true,
      message: `Removed AC base game files (freed ${size})`,
      freedSpace: size,
    };
  } catch (error) {
    console.error('[SteamService] Failed to cleanup AC base game:', error);
    throw new Error(`Failed to cleanup: ${error.message}`);
  }
}

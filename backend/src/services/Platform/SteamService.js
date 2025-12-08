import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Check if a valid Steam session exists for the given username
 * @param {string} steamUser - Steam username to check
 * @returns {Promise<boolean>} True if session exists and is valid
 */
async function hasCachedSteamSession(steamUser) {
  try {
    // Find SteamCMD binary
    let steamcmdPath = '/usr/games/steamcmd';
    try {
      const { stdout } = await execAsync('which steamcmd');
      steamcmdPath = stdout.trim();
    } catch (error) {
      const altPaths = ['/usr/games/steamcmd', '/usr/lib/games/steam/steamcmd'];
      for (const testPath of altPaths) {
        try {
          await fs.access(testPath);
          steamcmdPath = testPath;
          break;
        } catch (e) {
          // Continue checking
        }
      }
    }

    // Quick test: try to login with just username (will use cached session if exists)
    const scriptPath = '/tmp/test_session.txt';
    const scriptContent = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
login ${steamUser}
quit
`;

    await fs.writeFile(scriptPath, scriptContent);

    try {
      const { stdout } = await execAsync(`${steamcmdPath} +runscript ${scriptPath}`, {
        maxBuffer: 1024 * 1024,
        timeout: 15000,
      });

      await fs.unlink(scriptPath).catch(() => {});

      // If we see "Logged in OK" without providing password, session is valid
      return stdout.includes('Logged in OK') || stdout.includes('Waiting for user info');
    } catch (error) {
      await fs.unlink(scriptPath).catch(() => {});
      const output = (error.stdout || '') + (error.stderr || '');

      // Session is invalid if we get password prompt or login failure
      return false;
    }
  } catch (error) {
    console.warn('[SteamService] Session check failed:', error.message);
    return false;
  }
}

/**
 * Verify Steam credentials by attempting a quick login
 * @param {string} steamUser - Steam username
 * @param {string} steamPass - Steam password
 * @param {string} steamGuardCode - Steam Guard code (if enabled)
 * @returns {Promise<Object>} Verification result
 */
export async function verifySteamCredentials(steamUser, steamPass = '', steamGuardCode = '') {
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
        return {
          success: false,
          error: 'SteamCMD not installed',
          message: 'Please install SteamCMD first',
        };
      }
    }

    // Create temporary script for login test
    const scriptPath = '/tmp/verify_steam.txt';
    // NOTE: Do NOT use @NoPromptForPassword for verification - it prevents credential caching
    // We have all credentials (user/pass/guard code), so let Steam save the session
    let scriptContent = `@ShutdownOnFailedCommand 1
`;

    // Set Steam Guard code BEFORE login if provided
    if (steamGuardCode && steamGuardCode.trim()) {
      scriptContent += `set_steam_guard_code ${steamGuardCode.trim()}\n`;
    }

    scriptContent += `login ${steamUser} ${steamPass}
app_status 244210
quit
`;

    await fs.writeFile(scriptPath, scriptContent);

    // Ensure .steam directory exists (SteamCMD creates symlinks here)
    const steamDir = path.join(process.env.HOME || '/root', '.steam');
    await fs.mkdir(steamDir, { recursive: true }).catch(() => {});

    // Run SteamCMD with timeout (rejection: false to handle exit codes manually)
    let stdout = '';
    let stderr = '';
    try {
      const result = await execAsync(`${steamcmdPath} +runscript ${scriptPath}`, {
        maxBuffer: 1024 * 1024,
        timeout: 30000, // 30 second timeout
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      // SteamCMD returns non-zero exit codes even for expected failures (wrong password, etc)
      // So we need to capture output and check it rather than failing on exit code
      stdout = error.stdout || '';
      stderr = error.stderr || '';
    }

    // Clean up
    await fs.unlink(scriptPath).catch(() => {});

    const output = stdout + stderr;

    // Check for Steam Guard requirement
    if (
      output.includes('This computer has not been authenticated') ||
      output.includes('Steam Guard') ||
      output.includes('ERROR (Account Logon Denied)')
    ) {
      return {
        success: false,
        error: 'guard_code_required',
        message: 'Steam Guard code required. Please enter the code from your email',
      };
    }

    // Check for various error conditions
    if (output.includes('FAILED login with result code Invalid Password')) {
      return {
        success: false,
        error: 'invalid_password',
        message: 'Invalid Steam password',
      };
    }

    if (output.includes('FAILED login with result code Invalid Login Auth Code')) {
      return {
        success: false,
        error: 'invalid_guard_code',
        message: 'Invalid or expired Steam Guard code',
      };
    }

    if (output.includes('FAILED login with result code Expired Login Auth Code')) {
      return {
        success: false,
        error: 'expired_guard_code',
        message: 'Steam Guard code has expired. Please generate a new code',
      };
    }

    if (output.includes('FAILED login with result code Two Factor Code Mismatch')) {
      return {
        success: false,
        error: 'guard_code_required',
        message: 'Steam Guard code required but not provided or incorrect',
      };
    }

    if (output.includes('FAILED login with result code Rate Limit Exceeded')) {
      return {
        success: false,
        error: 'rate_limit',
        message: 'Too many login attempts. Please wait a few minutes and try again',
      };
    }

    if (output.includes('FAILED login')) {
      return {
        success: false,
        error: 'login_failed',
        message: 'Login failed. Please check your credentials',
      };
    }

    // Check for successful login
    if (output.includes('Logged in OK') || output.includes('Waiting for user info')) {
      // Steam session is now cached in ~/.steam/ directory
      // This session persists and can be reused for future operations without guard code
      return {
        success: true,
        message: 'Steam credentials verified successfully. Session saved for future downloads.',
        username: steamUser,
        sessionCached: true,
      };
    }

    // If we get here, something unexpected happened
    return {
      success: false,
      error: 'unknown',
      message: 'Unable to verify credentials. Please try again',
    };
  } catch (error) {
    console.error('[SteamService] Credential verification error:', error);

    if (error.killed) {
      return {
        success: false,
        error: 'timeout',
        message: 'Verification timed out. Please check your internet connection',
      };
    }

    return {
      success: false,
      error: 'exception',
      message: error.message || 'Failed to verify credentials',
    };
  }
}

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

    // Initialize SteamCMD properly (creates ~/.steam directory and symlinks)
    try {
      console.log('[SteamService] Initializing SteamCMD...');

      // Create ~/.steam directory if it doesn't exist
      await execAsync('mkdir -p ~/.steam');

      // Create symlinks that SteamCMD needs
      await execAsync('ln -sf ~/Steam ~/.steam/root || true');
      await execAsync('ln -sf ~/Steam ~/.steam/steam || true');

      // Run SteamCMD to complete initialization
      await execAsync(`${steamcmdPath} +login anonymous +quit`, {
        timeout: 60000, // 60 second timeout for initialization
      });

      console.log('[SteamService] SteamCMD initialized successfully');
    } catch (initError) {
      console.warn(
        '[SteamService] SteamCMD initialization warning (may be normal):',
        initError.message
      );
      // Continue anyway - initialization may have partially succeeded
    }

    // For now, ALWAYS require full credentials for downloads
    // Steam session caching with SteamCMD is unreliable - credentials are needed each time
    if (!steamUser || !steamPass) {
      throw new Error(
        '🔐 Steam credentials required. Please verify your Steam credentials first by clicking the "Login" button in the Steam Credentials section.'
      );
    }

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
app_license_request 244210
app_update 302550
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

    console.log('[SteamService] Verifying installation...');

    // Verify installation
    const acServerPath = path.join(installPath, 'acServer');
    try {
      await fs.access(acServerPath);
      await fs.chmod(acServerPath, 0o755); // Make executable

      // Clean up empty content directories created by Steam
      console.log('[SteamService] Cleaning up empty content directories...');
      const contentPath = path.join(installPath, 'content');
      const carsPath = path.join(contentPath, 'cars');
      const tracksPath = path.join(contentPath, 'tracks');

      // Remove empty car directories
      try {
        const carFolders = await fs.readdir(carsPath);
        for (const folder of carFolders) {
          const carPath = path.join(carsPath, folder);
          const stat = await fs.stat(carPath);
          if (stat.isDirectory()) {
            // Check if directory is empty or has only empty subdirectories
            const contents = await fs.readdir(carPath);
            if (contents.length === 0) {
              await fs.rm(carPath, { recursive: true });
              console.log(`[SteamService] Removed empty car directory: ${folder}`);
            }
          }
        }
      } catch (error) {
        console.warn('[SteamService] Could not clean car directories:', error.message);
      }

      // Remove empty track directories
      try {
        const trackFolders = await fs.readdir(tracksPath);
        for (const folder of trackFolders) {
          const trackPath = path.join(tracksPath, folder);
          const stat = await fs.stat(trackPath);
          if (stat.isDirectory()) {
            // Check if directory is empty or has only empty subdirectories
            const contents = await fs.readdir(trackPath);
            if (contents.length === 0) {
              await fs.rm(trackPath, { recursive: true });
              console.log(`[SteamService] Removed empty track directory: ${folder}`);
            }
          }
        }
      } catch (error) {
        console.warn('[SteamService] Could not clean track directories:', error.message);
      }

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

    // Log full error for server-side debugging
    console.error('[SteamService] Full SteamCMD output:', fullError.substring(0, 2000));

    // Check for "Missing configuration" error - SteamCMD needs proper initialization
    if (
      fullError.includes('Missing configuration') ||
      fullError.includes('failed to create symbolic link')
    ) {
      throw new Error(
        `⚙️ SteamCMD Configuration Issue\n\n` +
          `SteamCMD needs to be initialized properly. This usually happens on first run.\n\n` +
          `Quick fix:\n` +
          `Run this command in the container to initialize SteamCMD:\n` +
          `steamcmd +login anonymous +quit\n\n` +
          `Then try downloading the dedicated server again.`
      );
    }

    if (fullError.includes('No subscription')) {
      throw new Error(
        `🎮 Assetto Corsa Ownership Required\n\n` +
          `The AC Dedicated Server (App ID 302550) requires owning Assetto Corsa (App ID 244210).\n\n` +
          `Steps to download:\n` +
          `1. Go to the "Server" tab\n` +
          `2. Enter your Steam credentials (account that owns AC)\n` +
          `3. Click "Verify Login" with your Steam Guard code\n` +
          `4. Return here and try downloading again\n\n` +
          `Note: Anonymous download is NOT available for AC dedicated server despite it being free.`
      );
    }

    // Check for 0x50A error
    if (fullError.includes('state is 0x50A')) {
      const downloadStarted = fullError.includes('downloading, progress:');
      const progressMatch = fullError.match(/progress: ([\d.]+)/);
      const progress = progressMatch ? progressMatch[1] : '35';

      if (downloadStarted) {
        // Check if download is consistently failing at same percentage (Steam backend blocking)
        const stoppingState = fullError.includes('state (0x461) stopping');

        if (stoppingState) {
          // Steam is actively stopping/cancelling the download - backend restriction
          throw new Error(
            `🚫 Steam Server Blocked Download at ${progress}%\n\n` +
              `Your account authenticated successfully and owns Assetto Corsa, but Steam's servers are actively stopping the download.\n\n` +
              `This typically indicates:\n` +
              `• Account-level restrictions or flags on Steam's backend\n` +
              `• Regional licensing limitations for dedicated servers\n` +
              `• Steam Guard/verification requirements not fully met\n` +
              `• Rate limiting due to multiple download attempts\n\n` +
              `Recommended actions:\n` +
              `1. Wait 24 hours before trying again (rate limit cooldown)\n` +
              `2. Contact Steam Support with your account details\n` +
              `3. Try using a different Steam account that owns AC\n` +
              `4. Verify your Steam account is in good standing (no restrictions)\n\n` +
              `Note: This is NOT an issue with this application - your credentials work correctly but Steam's servers are refusing to complete the download for your specific account.`
          );
        }

        // Generic mid-download failure
        throw new Error(
          `🚫 Download Failed at ${progress}%\n\n` +
            `Steam stopped the download with error 0x50A.\n\n` +
            `Possible causes:\n` +
            `• Steam CDN/network interruption\n` +
            `• Temporary server issue\n` +
            `• Download cache corruption\n\n` +
            `The app clears download state automatically. Try again in a few minutes.\n` +
            `If it keeps failing at the same percentage, this may be a Steam backend restriction on your account.`
        );
      } else {
        // Error before download started - account doesn't own game
        throw new Error(
          `🚫 Your Steam account doesn't own Assetto Corsa (App ID 244210)\n\n` +
            `To download the AC Dedicated Server, you must purchase Assetto Corsa on Steam.`
        );
      }
    }

    if (fullError.includes('steamconsole.so')) {
      throw new Error('SteamCMD initialization failed. Please try again or contact support.');
    }

    // Check for email-based Steam Guard specifically
    if (
      fullError.includes('This computer has not been authenticated') ||
      fullError.includes('Please check your email for the message from Steam')
    ) {
      throw new Error(
        `📧 Steam Guard Email Code Required\n\n` +
          `Your Steam account requires email-based authentication for this computer.\n\n` +
          `Steps to proceed:\n` +
          `1. Check your email for a Steam Guard code from Steam Support\n` +
          `2. Enter the 5-character code (e.g., ABC12) in the Steam Guard Code field above\n` +
          `3. Click "Verify Login" first to authenticate this computer\n` +
          `4. Then try downloading the dedicated server again\n\n` +
          `Note: This is an EMAIL code, not a mobile authenticator code.`
      );
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
      error.code === 5 ||
      error.code === 8
    ) {
      // Exit code 8 typically means authentication failure
      // Check if it might be Steam Guard related even if not explicitly mentioned
      if (!steamGuardCode || steamGuardCode.trim() === '') {
        throw new Error(
          `❌ Steam Login Failed: Invalid credentials or Steam Guard required.\n\nPlease:\n1. Verify your password is correct (use the eye icon)\n2. If you have Steam Guard enabled, enter your current code\n3. For anonymous login, use username "anonymous" with empty password\n\nError code: ${
            error.code || 'unknown'
          }`
        );
      }
      throw new Error(
        `❌ Steam Login Failed: Credentials rejected.\n\nPossible issues:\n1. Password is incorrect\n2. Steam Guard code expired (get a fresh one - they refresh every 30s)\n3. Wrong type of Steam Guard code (email vs mobile app)\n4. Account has restrictions\n\nError code: ${
          error.code || 'unknown'
        }\nSteam output: ${errorOutput.substring(0, 800)}`
      );
    }

    // Return detailed error for debugging
    throw new Error(
      `SteamCMD failed (code ${error.code || 'unknown'}): ${errorOutput.substring(0, 1000)}`
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

    // Check if we have a valid cached session
    const hasSession = await hasCachedSteamSession(steamUser);

    // Create SteamCMD script for base game (App ID 244210)
    const scriptPath = '/tmp/install_ac_basegame.txt';
    let scriptContent = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
@sSteamCmdForcePlatformType windows
force_install_dir ${installPath}
`;

    if (hasSession) {
      // Use cached session - no password or guard code needed
      console.log(`[SteamService] Using cached Steam session for ${steamUser}`);
      scriptContent += `login ${steamUser}\n`;
    } else {
      // Fresh login with credentials
      console.log(`[SteamService] No cached session, using provided credentials`);

      // Set Steam Guard code BEFORE login if provided
      if (steamGuardCode && steamGuardCode.trim()) {
        scriptContent += `set_steam_guard_code ${steamGuardCode.trim()}\n`;
      }

      scriptContent += `login ${steamUser} ${steamPass}\n`;
    }

    scriptContent += `app_update 244210 validate
quit
`;

    await fs.writeFile(scriptPath, scriptContent);

    // Run SteamCMD
    console.log('[SteamService] Starting AC base game download (~12GB, may take 10-60 minutes)...');
    const { stdout, stderr } = await execAsync(`${steamcmdPath} +runscript ${scriptPath}`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      timeout: 7200000, // 2 hour timeout for large downloads (better for slow connections)
    });

    // Clean up script
    await fs.unlink(scriptPath).catch(() => {});

    // Check if download completed (even if interrupted)
    // SteamCMD may place content in different locations
    const possibleContentPaths = [
      path.join(installPath, 'steamapps', 'common', 'assettocorsa', 'content'),
      path.join(installPath, 'steamapps', 'downloading', '244210', 'content'),
      path.join(installPath, 'content'),
    ];

    let foundContentPath = null;
    for (const testPath of possibleContentPaths) {
      try {
        await fs.access(path.join(testPath, 'cars'));
        await fs.access(path.join(testPath, 'tracks'));
        foundContentPath = testPath;
        console.log(`[SteamService] Found downloaded content at: ${foundContentPath}`);
        break;
      } catch {
        // Try next path
      }
    }

    if (!foundContentPath) {
      throw new Error(
        `AC game download failed or incomplete. Content not found in: ${possibleContentPaths.join(
          ', '
        )}`
      );
    }

    // Count downloaded content
    const carsPath = path.join(foundContentPath, 'cars');
    const tracksPath = path.join(foundContentPath, 'tracks');

    const { stdout: carCount } = await execAsync(`find "${carsPath}" -type d -maxdepth 1 | wc -l`);
    const { stdout: trackCount } = await execAsync(
      `find "${tracksPath}" -type d -maxdepth 1 | wc -l`
    );

    console.log(
      `[SteamService] Download complete: ${parseInt(carCount.trim()) - 1} cars, ${
        parseInt(trackCount.trim()) - 1
      } tracks`
    );

    return {
      success: true,
      message: 'AC base game downloaded successfully',
      path: installPath,
      contentPath: foundContentPath,
      carCount: parseInt(carCount.trim()) - 1, // Subtract 1 for parent directory
      trackCount: parseInt(trackCount.trim()) - 1,
      downloaded: true,
      output: stdout,
    };
  } catch (error) {
    console.error('[SteamService] Failed to download AC base game:', error);

    // Reuse error handling from downloadACServer
    const errorOutput = error.stdout || error.message || '';
    const errorStderr = error.stderr || '';
    const fullError = errorOutput + '\n' + errorStderr;

    // Log full error for server-side debugging
    console.error('[SteamService] Full SteamCMD output (base game):', fullError.substring(0, 2000));

    // Check for corrupted download / CDN issues FIRST (before auth errors)
    if (
      fullError.includes('bad chunk') ||
      fullError.includes('Unpack failed') ||
      fullError.includes('Failed updating depot')
    ) {
      // Auto-clear Steam cache to fix corruption
      try {
        await execAsync('rm -rf /root/Steam/steamapps/downloading/*');
        await execAsync('rm -rf /root/Steam/appcache/*');
        await execAsync(`rm -rf ${installPath}`);
      } catch (cleanupErr) {
        console.error('[SteamService] Failed to cleanup corrupted cache:', cleanupErr);
      }

      throw new Error(
        `📦 Steam Download Corruption Detected\n\n` +
          `The download started successfully but failed due to corrupted data from Steam's CDN servers. This is a temporary Steam infrastructure issue, not a problem with your account or credentials.\n\n` +
          `✅ Your cache has been automatically cleared.\n\n` +
          `🔄 Please try downloading again - it should work on the next attempt.`
      );
    }

    if (fullError.includes('No subscription')) {
      throw new Error(
        'Steam account does not own Assetto Corsa. You must purchase the game to download content.'
      );
    }

    // Check for 0x50A error that occurs AFTER download starts
    if (fullError.includes('state is 0x50A')) {
      const downloadStarted = fullError.includes('downloading, progress:');

      if (downloadStarted) {
        // Download started then failed - likely family sharing or CDN issue
        throw new Error(
          `🚫 Download Failed After Starting\n\n` +
            `The download began successfully but Steam stopped it with error 0x50A. This can happen due to:\n\n` +
            `• Family Sharing: Your account may have access via Family Sharing, but SteamCMD cannot download shared games\n` +
            `• Temporary Steam issue: Try again in a few minutes\n\n` +
            `If this persists, verify you own Assetto Corsa directly (not through family sharing).`
        );
      } else {
        // Error before download started - doesn't own game
        throw new Error(
          `🚫 Your Steam account doesn't own Assetto Corsa (App ID 244210)\n\n` +
            `To download official content, you must purchase Assetto Corsa on Steam.`
        );
      }
    }

    if (fullError.includes('steamconsole.so')) {
      throw new Error('SteamCMD initialization failed. Please try again or contact support.');
    }
    if (
      fullError.includes('Two-factor') ||
      fullError.includes('Steam Guard') ||
      fullError.includes('GUARD') ||
      fullError.includes('Account Logon Denied') ||
      fullError.includes('Please login with valid credentials')
    ) {
      throw new Error(
        `🔐 Steam session expired or invalid. Please re-verify your Steam credentials in the Setup → Server tab.`
      );
    }
    if (
      fullError.includes('Login Failure') ||
      fullError.includes('Invalid Password') ||
      error.code === 5 ||
      error.code === 8
    ) {
      throw new Error(
        `❌ Steam login failed. Please re-verify your Steam credentials in the Setup → Server tab.\n\nError code: ${
          error.code || 'unknown'
        }`
      );
    }

    throw new Error(
      `SteamCMD failed to download AC base game (code ${
        error.code || 'unknown'
      }): ${errorOutput.substring(0, 1000)}`
    );
  }
}

/**
 * Check if AC base game is downloaded and ready for extraction
 * @param {string} gameInstallPath - Path where AC base game should be (e.g., /tmp/ac-basegame)
 * @returns {Promise<Object>} Status of base game download
 */
export async function checkBaseGameDownloaded(gameInstallPath) {
  try {
    const possibleContentPaths = [
      path.join(gameInstallPath, 'steamapps', 'common', 'assettocorsa', 'content'),
      path.join(gameInstallPath, 'steamapps', 'downloading', '244210', 'content'),
      path.join(gameInstallPath, 'content'),
    ];

    const possibleServerPaths = [
      path.join(gameInstallPath, 'steamapps', 'common', 'assettocorsa', 'server'),
      path.join(gameInstallPath, 'steamapps', 'downloading', '244210', 'server'),
      path.join(gameInstallPath, 'server'),
    ];

    for (const testPath of possibleContentPaths) {
      try {
        const carsPath = path.join(testPath, 'cars');
        const tracksPath = path.join(testPath, 'tracks');
        await fs.access(carsPath);
        await fs.access(tracksPath);

        // Count content
        const { stdout: carCount } = await execAsync(
          `find "${carsPath}" -type d -maxdepth 1 | wc -l`
        );
        const { stdout: trackCount } = await execAsync(
          `find "${tracksPath}" -type d -maxdepth 1 | wc -l`
        );

        // Get size
        const { stdout: sizeOutput } = await execAsync(`du -sh "${gameInstallPath}"`);
        const size = sizeOutput.split('\t')[0];

        // Check if server files also exist
        let serverFound = false;
        for (const serverPath of possibleServerPaths) {
          try {
            await fs.access(path.join(serverPath, 'acServer'));
            serverFound = true;
            break;
          } catch {
            // Try next path
          }
        }

        return {
          installed: true,
          path: gameInstallPath,
          contentPath: testPath,
          carCount: parseInt(carCount.trim()) - 1,
          trackCount: parseInt(trackCount.trim()) - 1,
          size,
          serverFound,
        };
      } catch {
        // Try next path
      }
    }

    return { installed: false };
  } catch (error) {
    console.error('[SteamService] Error checking base game:', error);
    return { installed: false };
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
      `[SteamService] Extracting server + content from ${gameInstallPath} to ${serverContentPath}...`
    );

    const serverPath = path.dirname(serverContentPath); // e.g., /opt/acserver

    // SteamCMD installs to different paths depending on state
    // Try common locations for AC content
    const possibleContentPaths = [
      path.join(gameInstallPath, 'steamapps', 'common', 'assettocorsa', 'content'),
      path.join(gameInstallPath, 'steamapps', 'downloading', '244210', 'content'),
      path.join(gameInstallPath, 'content'),
    ];

    let contentBasePath = null;
    for (const p of possibleContentPaths) {
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
        `Could not find AC content in ${gameInstallPath}. Tried: ${possibleContentPaths.join(', ')}`
      );
    }

    // Also look for server files (Windows version has acServer.exe)
    const possibleServerPaths = [
      path.join(gameInstallPath, 'steamapps', 'common', 'assettocorsa', 'server'),
      path.join(gameInstallPath, 'steamapps', 'downloading', '244210', 'server'),
      path.join(gameInstallPath, 'server'),
    ];

    let serverSourcePath = null;
    for (const p of possibleServerPaths) {
      try {
        // Check for both Windows (acServer.exe) and Linux (acServer) binaries
        const windowsExe = path.join(p, 'acServer.exe');
        const linuxBinary = path.join(p, 'acServer');
        try {
          await fs.access(windowsExe);
          serverSourcePath = p;
          console.log(`[SteamService] Found Windows server files at: ${serverSourcePath}`);
          break;
        } catch {
          await fs.access(linuxBinary);
          serverSourcePath = p;
          console.log(`[SteamService] Found Linux server files at: ${serverSourcePath}`);
          break;
        }
      } catch {
        // Try next path
      }
    }

    if (!serverSourcePath) {
      console.warn(
        `[SteamService] Could not find AC server files in ${gameInstallPath}. Tried: ${possibleServerPaths.join(
          ', '
        )}`
      );
      // Continue anyway - some installs may have content but not server
    }

    // Extract server files first (if found)
    if (serverSourcePath) {
      console.log('[SteamService] Copying server files...');
      await fs.mkdir(serverPath, { recursive: true });

      // Copy all server files except content directory (we'll handle that separately)
      await execAsync(`rsync -av "${serverSourcePath}/" "${serverPath}/" --exclude=content`, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 600000, // 10 minute timeout
      });

      // Verify server executable exists (check both Windows and Linux versions)
      const windowsExe = path.join(serverPath, 'acServer.exe');
      const linuxExe = path.join(serverPath, 'acServer');
      try {
        await fs.access(windowsExe);
        console.log(`[SteamService] Windows server executable verified at: ${windowsExe}`);
      } catch {
        try {
          await fs.access(linuxExe, fs.constants.X_OK);
          console.log(`[SteamService] Linux server executable verified at: ${linuxExe}`);
        } catch {
          console.warn(
            `[SteamService] Server executable not found at: ${windowsExe} or ${linuxExe}`
          );
        }
      }
    }

    // Extract content
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

    const result = {
      success: true,
      message: serverSourcePath
        ? 'Server and content extracted successfully'
        : 'Content extracted successfully (server files not found)',
      carCount: parseInt(carCount.trim()) - 1,
      trackCount: parseInt(trackCount.trim()) - 1,
      serverInstalled: !!serverSourcePath,
    };

    console.log(`[SteamService] Extraction complete:`, result);
    return result;
  } catch (error) {
    console.error('[SteamService] Failed to extract content:', error);
    throw new Error(`Failed to extract server/content: ${error.message}`);
  }
}

/**
 * Remove AC base game files after content extraction
 * NOTE: This preserves the server directory since it's needed to run the AC server via Wine
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

    // Find where the actual game files are (SteamCMD structure)
    const possibleGamePaths = [
      path.join(gameInstallPath, 'steamapps', 'common', 'assettocorsa'),
      path.join(gameInstallPath, 'steamapps', 'downloading', '244210'),
    ];

    let actualGamePath = null;
    for (const p of possibleGamePaths) {
      try {
        await fs.access(p);
        actualGamePath = p;
        console.log(`[SteamService] Found game files at: ${actualGamePath}`);
        break;
      } catch {
        // Try next path
      }
    }

    if (actualGamePath) {
      // Remove everything EXCEPT the server directory
      console.log(`[SteamService] Cleaning up game files, preserving server directory...`);
      const entries = await fs.readdir(actualGamePath);
      
      for (const entry of entries) {
        if (entry === 'server') {
          console.log(`[SteamService] Preserving server directory`);
          continue; // Skip server directory
        }
        
        const entryPath = path.join(actualGamePath, entry);
        console.log(`[SteamService] Removing: ${entry}`);
        await fs.rm(entryPath, { recursive: true, force: true });
      }
      
      // Also clean up steamapps metadata but keep the game structure
      const steamappsPath = path.join(gameInstallPath, 'steamapps');
      const manifestsPath = path.join(steamappsPath, 'appmanifest_*.acf');
      try {
        await execAsync(`rm -f ${manifestsPath}`);
      } catch {
        // Ignore if manifests don't exist
      }
    } else {
      // Fallback: If we can't find the standard structure, just delete everything
      // (This shouldn't happen with normal SteamCMD installs)
      console.warn(`[SteamService] Could not find standard game structure, removing entire directory`);
      await fs.rm(gameInstallPath, { recursive: true, force: true });
    }

    console.log(`[SteamService] Cleaned up ${size} from ${gameInstallPath} (preserved server files)`);

    return {
      success: true,
      message: `Removed AC base game files (freed ${size}, preserved server directory)`,
      freedSpace: size,
    };
  } catch (error) {
    console.error('[SteamService] Failed to cleanup AC base game:', error);
    throw new Error(`Failed to cleanup: ${error.message}`);
  }
}

/**
 * Uninstall SteamCMD
 * @returns {Promise<Object>}
 */
export async function uninstallSteamCMD() {
  try {
    console.log('[SteamService] Uninstalling SteamCMD...');

    // Remove SteamCMD package
    await execAsync('sudo apt-get remove -y steamcmd');
    await execAsync('sudo apt-get autoremove -y');

    // Remove Steam directories
    const steamDirs = ['/root/Steam', '/root/.steam', '/root/.local/share/Steam'];
    for (const dir of steamDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`[SteamService] Removed ${dir}`);
      } catch (error) {
        // Directory might not exist, that's okay
        console.log(`[SteamService] Skipped ${dir} (doesn't exist)`);
      }
    }

    return {
      success: true,
      message: 'SteamCMD uninstalled successfully',
    };
  } catch (error) {
    console.error('[SteamService] Failed to uninstall SteamCMD:', error);
    throw new Error(`Failed to uninstall SteamCMD: ${error.message}`);
  }
}

/**
 * Uninstall AC Dedicated Server
 * @param {string} installPath - Path where AC server is installed
 * @returns {Promise<Object>}
 */
export async function uninstallACServer(installPath) {
  try {
    console.log(`[SteamService] Uninstalling AC Dedicated Server from ${installPath}...`);

    // Safety check - don't delete if path looks suspicious
    if (installPath === '/' || installPath === '/opt' || installPath.length < 5) {
      throw new Error(`Refusing to delete suspicious path: ${installPath}`);
    }

    // Check if directory exists
    try {
      await fs.access(installPath);
    } catch {
      return {
        success: false,
        message: `Directory does not exist: ${installPath}`,
      };
    }

    // Get size before deletion
    let size = 'Unknown';
    try {
      const { stdout: sizeOutput } = await execAsync(`du -sh ${installPath} 2>/dev/null`);
      size = sizeOutput.split('\t')[0];
    } catch {
      // Size check failed, continue anyway
    }

    // Remove directory
    await fs.rm(installPath, { recursive: true, force: true });

    console.log(`[SteamService] Uninstalled AC server, freed ${size}`);

    return {
      success: true,
      message: `AC Dedicated Server uninstalled (freed ${size})`,
      freedSpace: size,
    };
  } catch (error) {
    console.error('[SteamService] Failed to uninstall AC server:', error);
    throw new Error(`Failed to uninstall AC server: ${error.message}`);
  }
}

/**
 * Delete AC content folders (cars, tracks, or both)
 * @param {string} contentPath - Path to AC server content folder
 * @param {string} type - 'cars', 'tracks', or 'both'
 * @returns {Promise<Object>}
 */
export async function deleteACContent(contentPath, type = 'both') {
  try {
    console.log(`[SteamService] Deleting ${type} from ${contentPath}...`);

    // Safety check
    if (contentPath === '/' || contentPath.length < 5) {
      throw new Error(`Refusing to delete suspicious path: ${contentPath}`);
    }

    const results = {};
    const foldersToDelete = [];

    if (type === 'cars' || type === 'both') {
      foldersToDelete.push(path.join(contentPath, 'cars'));
    }
    if (type === 'tracks' || type === 'both') {
      foldersToDelete.push(path.join(contentPath, 'tracks'));
    }

    for (const folder of foldersToDelete) {
      try {
        await fs.access(folder);

        // Get size before deletion
        let size = 'Unknown';
        try {
          const { stdout: sizeOutput } = await execAsync(`du -sh ${folder} 2>/dev/null`);
          size = sizeOutput.split('\t')[0];
        } catch {
          // Continue anyway
        }

        // Count items
        const items = await fs.readdir(folder);
        const count = items.length;

        // Remove folder
        await fs.rm(folder, { recursive: true, force: true });

        // Recreate empty folder
        await fs.mkdir(folder, { recursive: true });

        results[path.basename(folder)] = {
          deleted: count,
          freedSpace: size,
        };

        console.log(`[SteamService] Deleted ${count} items from ${folder}, freed ${size}`);
      } catch (error) {
        console.log(`[SteamService] Skipped ${folder}: ${error.message}`);
        results[path.basename(folder)] = {
          deleted: 0,
          freedSpace: '0',
          error: error.message,
        };
      }
    }

    return {
      success: true,
      message: `Deleted ${type} content successfully`,
      results,
    };
  } catch (error) {
    console.error('[SteamService] Failed to delete content:', error);
    throw new Error(`Failed to delete content: ${error.message}`);
  }
}

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GitHub repository info - update these to match your actual repo
const GITHUB_OWNER = 'Brewsker'; // Update this to your GitHub username
const GITHUB_REPO = 'ac-server-manager'; // Update this to your repo name
const GITHUB_API = 'https://api.github.com';

class UpdateService {
  constructor() {
    this.currentVersion = null;
    this.checkInProgress = false;
  }

  /**
   * Get the current version from package.json
   */
  async getCurrentVersion() {
    if (this.currentVersion) {
      return this.currentVersion;
    }

    try {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      this.currentVersion = packageJson.version;
      return this.currentVersion;
    } catch (error) {
      console.error('[UpdateService] Failed to read current version:', error);
      return '0.1.0'; // fallback
    }
  }

  /**
   * Helper to make HTTPS requests
   */
  fetchJSON(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ ok: true, status: res.statusCode, data: JSON.parse(data) });
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            resolve({ ok: false, status: res.statusCode, data: null });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Check GitHub for the latest release
   */
  async checkForUpdates() {
    if (this.checkInProgress) {
      return { checking: true };
    }

    this.checkInProgress = true;

    try {
      const currentVersion = await this.getCurrentVersion();

      // Fetch latest release from GitHub
      const response = await this.fetchJSON(
        `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AC-Server-Manager',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No releases found
          return {
            updateAvailable: false,
            currentVersion,
            latestVersion: currentVersion,
            message: 'No releases found on GitHub',
          };
        }
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const release = response.data;
      const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

      const updateAvailable = this.compareVersions(latestVersion, currentVersion) > 0;

      return {
        updateAvailable,
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url,
        releaseNotes: release.body,
        publishedAt: release.published_at,
        assets: release.assets.map((asset) => ({
          name: asset.name,
          size: asset.size,
          downloadUrl: asset.browser_download_url,
        })),
      };
    } catch (error) {
      console.error('[UpdateService] Failed to check for updates:', error);
      return {
        error: true,
        message: error.message,
        currentVersion: await this.getCurrentVersion(),
      };
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Compare two semantic version strings
   * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map((n) => parseInt(n, 10));
    const parts2 = v2.split('.').map((n) => parseInt(n, 10));

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  /**
   * Get update check status
   */
  getStatus() {
    return {
      checking: this.checkInProgress,
      currentVersion: this.currentVersion,
    };
  }

  /**
   * Apply update by pulling latest code from git
   * This will:
   * 1. Pull latest code from git
   * 2. Install dependencies (if package.json changed)
   * 3. Rebuild frontend
   * 4. Restart the server
   */
  async applyUpdate() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('[UpdateService] Starting update process...');

    try {
      // Check if we're in a git repository
      try {
        await execAsync('git rev-parse --git-dir');
      } catch (error) {
        throw new Error('Not a git repository. Manual update required.');
      }

      // Pull latest code
      console.log('[UpdateService] Pulling latest code from git...');
      const { stdout: gitOutput } = await execAsync('git pull');
      console.log('[UpdateService] Git pull output:', gitOutput);

      if (gitOutput.includes('Already up to date')) {
        return {
          success: true,
          message: 'Already up to date',
          requiresRestart: false,
        };
      }

      // Install/update dependencies
      console.log('[UpdateService] Installing dependencies...');
      await execAsync('npm install', { cwd: path.join(__dirname, '../..') });

      // Build frontend
      console.log('[UpdateService] Building frontend...');
      await execAsync('npm run build', { cwd: path.join(__dirname, '../../frontend') });

      console.log('[UpdateService] Update completed successfully');

      return {
        success: true,
        message: 'Update applied successfully. Server will restart in 3 seconds.',
        requiresRestart: true,
      };
    } catch (error) {
      console.error('[UpdateService] Failed to apply update:', error);
      throw new Error(`Update failed: ${error.message}`);
    }
  }
}

export default new UpdateService();

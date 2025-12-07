import express from 'express';
import { SteamService as steamService } from '../services/Platform/index.js';

const router = express.Router();

/**
 * GET /api/steam/check-steamcmd
 * Check if SteamCMD is installed
 */
router.get('/check-steamcmd', async (req, res) => {
  try {
    const installed = await steamService.isSteamCMDInstalled();
    res.json({ installed });
  } catch (error) {
    console.error('[SteamRoutes] Error checking SteamCMD:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to check SteamCMD installation',
    });
  }
});

/**
 * POST /api/steam/install-steamcmd
 * Install SteamCMD
 */
router.post('/install-steamcmd', async (req, res) => {
  try {
    const result = await steamService.installSteamCMD();
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error installing SteamCMD:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to install SteamCMD',
    });
  }
});

/**
 * POST /api/steam/download-ac-server
 * Download AC Dedicated Server
 * Body: { installPath, steamUser?, steamPass? }
 */
router.post('/download-ac-server', async (req, res) => {
  try {
    const { installPath, steamUser, steamPass, steamGuardCode } = req.body;

    if (!installPath) {
      return res.status(400).json({
        error: true,
        message: 'installPath is required',
      });
    }

    const result = await steamService.downloadACServer(
      installPath,
      steamUser,
      steamPass,
      steamGuardCode
    );
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error downloading AC server:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to download AC server',
    });
  }
});

/**
 * GET /api/steam/check-ac-server
 * Check if AC server is installed
 * Query: ?path=/path/to/server
 */
router.get('/check-ac-server', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({
        error: true,
        message: 'path query parameter is required',
      });
    }

    const result = await steamService.checkACServerInstalled(path);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error checking AC server:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to check AC server installation',
    });
  }
});

/**
 * GET /api/steam/check-cache
 * Check if AC server cache exists on git-cache server
 * Query: ?host=192.168.1.70 (optional, defaults to 192.168.1.70)
 */
router.get('/check-cache', async (req, res) => {
  try {
    const { host } = req.query;
    const result = await steamService.checkACServerCache(host);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error checking AC server cache:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to check AC server cache',
    });
  }
});

/**
 * POST /api/steam/copy-from-cache
 * Copy AC server from git-cache to local install path
 * Body: { installPath, cacheHost? }
 */
router.post('/copy-from-cache', async (req, res) => {
  try {
    const { installPath, cacheHost } = req.body;

    if (!installPath) {
      return res.status(400).json({
        error: true,
        message: 'installPath is required',
      });
    }

    const result = await steamService.copyACServerFromCache(installPath, cacheHost);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error copying AC server from cache:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to copy AC server from cache',
    });
  }
});

/**
 * POST /api/steam/download-base-game
 * Download AC base game for content extraction
 * Body: { installPath, steamUser, steamPass, steamGuardCode? }
 */
router.post('/download-base-game', async (req, res) => {
  try {
    const { installPath, steamUser, steamPass, steamGuardCode } = req.body;

    if (!installPath || !steamUser || !steamPass) {
      return res.status(400).json({
        error: true,
        message: 'installPath, steamUser, and steamPass are required',
      });
    }

    const result = await steamService.downloadACBaseGame(
      installPath,
      steamUser,
      steamPass,
      steamGuardCode
    );
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error downloading AC base game:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to download AC base game',
    });
  }
});

/**
 * POST /api/steam/extract-content
 * Extract content from AC base game to server
 * Body: { gameInstallPath, serverContentPath }
 */
router.post('/extract-content', async (req, res) => {
  try {
    const { gameInstallPath, serverContentPath } = req.body;

    if (!gameInstallPath || !serverContentPath) {
      return res.status(400).json({
        error: true,
        message: 'gameInstallPath and serverContentPath are required',
      });
    }

    const result = await steamService.extractACContent(gameInstallPath, serverContentPath);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error extracting content:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to extract content',
    });
  }
});

/**
 * POST /api/steam/cleanup-base-game
 * Remove AC base game files after extraction
 * Body: { gameInstallPath }
 */
router.post('/cleanup-base-game', async (req, res) => {
  try {
    const { gameInstallPath } = req.body;

    if (!gameInstallPath) {
      return res.status(400).json({
        error: true,
        message: 'gameInstallPath is required',
      });
    }

    const result = await steamService.cleanupACBaseGame(gameInstallPath);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error cleaning up base game:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to cleanup base game',
    });
  }
});

/**
 * POST /api/steam/uninstall-steamcmd
 * Uninstall SteamCMD completely
 */
router.post('/uninstall-steamcmd', async (req, res) => {
  try {
    const result = await steamService.uninstallSteamCMD();
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error uninstalling SteamCMD:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to uninstall SteamCMD',
    });
  }
});

/**
 * POST /api/steam/uninstall-ac-server
 * Uninstall AC Dedicated Server
 * Body: { installPath }
 */
router.post('/uninstall-ac-server', async (req, res) => {
  try {
    const { installPath } = req.body;

    if (!installPath) {
      return res.status(400).json({
        error: true,
        message: 'installPath is required',
      });
    }

    const result = await steamService.uninstallACServer(installPath);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error uninstalling AC server:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to uninstall AC server',
    });
  }
});

/**
 * POST /api/steam/delete-content
 * Delete AC content (cars, tracks, or both)
 * Body: { contentPath, type }
 */
router.post('/delete-content', async (req, res) => {
  try {
    const { contentPath, type } = req.body;

    if (!contentPath) {
      return res.status(400).json({
        error: true,
        message: 'contentPath is required',
      });
    }

    if (!['cars', 'tracks', 'both'].includes(type)) {
      return res.status(400).json({
        error: true,
        message: 'type must be "cars", "tracks", or "both"',
      });
    }

    const result = await steamService.deleteACContent(contentPath, type);
    res.json(result);
  } catch (error) {
    console.error('[SteamRoutes] Error deleting content:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to delete content',
    });
  }
});

export default router;

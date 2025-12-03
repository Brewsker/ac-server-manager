import express from 'express';
import * as steamService from '../services/steamService.js';

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
    const { installPath, steamUser, steamPass } = req.body;

    if (!installPath) {
      return res.status(400).json({
        error: true,
        message: 'installPath is required',
      });
    }

    const result = await steamService.downloadACServer(installPath, steamUser, steamPass);
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

export default router;

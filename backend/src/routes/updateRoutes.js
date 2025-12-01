import express from 'express';
import updateService from '../services/updateService.js';

const router = express.Router();

/**
 * GET /api/update/check
 * Check for available updates
 */
router.get('/check', async (req, res) => {
  try {
    console.log('[UpdateRoutes] Checking for updates...');
    const updateInfo = await updateService.checkForUpdates();
    res.json(updateInfo);
  } catch (error) {
    console.error('[UpdateRoutes] Error checking for updates:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to check for updates',
      details: error.message,
    });
  }
});

/**
 * GET /api/update/status
 * Get current update check status
 */
router.get('/status', async (req, res) => {
  try {
    const status = updateService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('[UpdateRoutes] Error getting update status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get update status',
    });
  }
});

/**
 * GET /api/update/version
 * Get current app version
 */
router.get('/version', async (req, res) => {
  try {
    const version = await updateService.getCurrentVersion();
    res.json({ version });
  } catch (error) {
    console.error('[UpdateRoutes] Error getting version:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get version',
    });
  }
});

export default router;

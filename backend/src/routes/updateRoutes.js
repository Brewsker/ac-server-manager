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

/**
 * POST /api/update/apply
 * Apply the update (git pull, npm install, rebuild)
 */
router.post('/apply', async (req, res) => {
  try {
    console.log('[UpdateRoutes] Applying update...');
    const result = await updateService.applyUpdate();

    // Send response before restarting
    res.json(result);

    // If restart is required, schedule it after response is sent
    if (result.requiresRestart) {
      setTimeout(() => {
        console.log('[UpdateRoutes] Restarting server...');
        process.exit(0); // PM2/Docker will restart automatically
      }, 3000);
    }
  } catch (error) {
    console.error('[UpdateRoutes] Error applying update:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to apply update',
      details: error.message,
    });
  }
});

export default router;

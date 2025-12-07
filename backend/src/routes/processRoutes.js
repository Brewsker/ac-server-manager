import express from 'express';
import * as serverProcessManager from '../services/serverProcessManager.js';
import * as presetService from '../services/presetService.js';
import * as configStateManager from '../services/configStateManager.js';

const router = express.Router();

// Check AC server installation
router.get('/installation', async (req, res, next) => {
  try {
    const result = await serverProcessManager.checkACServerInstallation();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Start a server instance
router.post('/start/:presetId', async (req, res, next) => {
  try {
    const { presetId } = req.params;

    // Load the preset configuration
    const presets = await presetService.getAllPresets();
    const preset = presets.find((p) => p.id === presetId);

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // Load preset config
    await presetService.loadPreset(presetId);
    const config = await configStateManager.getWorkingConfig();

    // Apply config to AC server INI files before starting
    await configStateManager.applyWorkingConfig();

    // Start the server
    const result = await serverProcessManager.startServer(presetId, config);

    res.json({
      message: 'Server starting',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// Stop a server instance
router.post('/stop/:presetId', async (req, res, next) => {
  try {
    const { presetId } = req.params;
    const result = await serverProcessManager.stopServer(presetId);

    res.json({
      message: 'Server stopped',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// Restart a server instance
router.post('/restart/:presetId', async (req, res, next) => {
  try {
    const { presetId } = req.params;

    // Load the preset configuration
    await presetService.loadPreset(presetId);
    const config = await configStateManager.getWorkingConfig();

    // Apply config to AC server INI files before restarting
    await configStateManager.applyWorkingConfig();

    // Restart the server
    const result = await serverProcessManager.restartServer(presetId, config);

    res.json({
      message: 'Server restarting',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// Get status of a specific server
router.get('/status/:presetId', async (req, res, next) => {
  try {
    const { presetId } = req.params;
    const status = serverProcessManager.getServerStatus(presetId);

    if (!status) {
      return res.json({
        presetId,
        status: 'stopped',
        running: false,
      });
    }

    res.json({
      ...status,
      running: status.status === 'running' || status.status === 'starting',
    });
  } catch (error) {
    next(error);
  }
});

// Get status of all servers
router.get('/status', async (req, res, next) => {
  try {
    const statuses = serverProcessManager.getAllServerStatuses();

    // Map the statuses to include 'running' boolean and 'name' field
    const mappedStatuses = statuses.map((status) => ({
      ...status,
      running: status.status === 'running' || status.status === 'starting',
      name: status.config?.serverName,
      port: status.config?.udpPort,
    }));

    res.json({ servers: mappedStatuses });
  } catch (error) {
    next(error);
  }
});

// Get server logs
router.get('/logs/:presetId', async (req, res, next) => {
  try {
    const { presetId } = req.params;
    const lines = parseInt(req.query.lines) || 100;

    const logs = serverProcessManager.getServerLogs(presetId, lines);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// Stop all servers
router.post('/stop-all', async (req, res, next) => {
  try {
    const results = await serverProcessManager.stopAllServers();
    res.json({
      message: 'All servers stopped',
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

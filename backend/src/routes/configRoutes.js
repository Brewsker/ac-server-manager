import express from 'express';
import * as configStateManager from '../services/configStateManager.js';
import * as presetService from '../services/presetService.js';

const router = express.Router();

// Get working configuration (what user is editing)
router.get('/', async (req, res, next) => {
  try {
    const config = await configStateManager.getWorkingConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Update working configuration (doesn't save to server yet)
router.put('/', async (req, res, next) => {
  try {
    const result = await configStateManager.updateWorkingConfig(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Apply working config to active server config
router.post('/apply', async (req, res, next) => {
  try {
    const result = await configStateManager.applyWorkingConfig();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get default configuration
router.get('/default', async (req, res, next) => {
  try {
    const config = await configStateManager.getDefaultConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Load default config to working
router.post('/load-default', async (req, res, next) => {
  try {
    const result = await configStateManager.loadDefaultToWorking();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get active server configuration (what's in INI files)
router.get('/active', async (req, res, next) => {
  try {
    const config = await configStateManager.getActiveConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Load active config to working
router.post('/load-active', async (req, res, next) => {
  try {
    const result = await configStateManager.loadActiveToWorking();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get configuration presets
router.get('/presets', async (req, res, next) => {
  try {
    console.log('GET /api/config/presets - Fetching presets...');
    const presets = await presetService.getAllPresets();
    console.log(`Found ${presets.length} presets`);
    res.json({ presets });
  } catch (error) {
    console.error('Error in GET /presets:', error);
    next(error);
  }
});

// Save current config as preset
router.post('/presets', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const preset = await presetService.savePreset(name, description);
    res.json({ message: 'Preset saved', preset });
  } catch (error) {
    next(error);
  }
});

// Load a preset
router.post('/presets/:id/load', async (req, res, next) => {
  try {
    await presetService.loadPreset(req.params.id);
    res.json({ message: 'Preset loaded successfully' });
  } catch (error) {
    next(error);
  }
});

// Duplicate a preset
router.post('/presets/:id/duplicate', async (req, res, next) => {
  try {
    const { name } = req.body;
    const preset = await presetService.duplicatePreset(req.params.id, name);
    res.json({ message: 'Preset duplicated', preset });
  } catch (error) {
    next(error);
  }
});

// Rename a preset
router.patch('/presets/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    const preset = await presetService.renamePreset(req.params.id, name);
    res.json({ message: 'Preset renamed', preset });
  } catch (error) {
    next(error);
  }
});

// Delete a preset
router.delete('/presets/:id', async (req, res, next) => {
  try {
    await presetService.deletePreset(req.params.id);
    res.json({ message: 'Preset deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

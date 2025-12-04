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
// Accepts either { name, description } (uses working config)
// or { name, description, config } (saves provided config)
router.post('/presets', async (req, res, next) => {
  try {
    const { name, description, config } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Preset name is required' });
    }

    console.log(`[POST /presets] Saving preset: ${name}`);
    if (config) {
      const configKeys = Object.keys(config);
      const carSections = configKeys.filter((k) => k.startsWith('CAR_'));
      console.log(
        `[POST /presets] Config provided with ${configKeys.length} sections, ${carSections.length} CAR entries`
      );
    } else {
      console.log(`[POST /presets] No config provided, will use working config`);
    }

    const preset = await presetService.savePreset(name, config || null, description || '');
    res.json({ message: 'Preset saved', preset });
  } catch (error) {
    console.error('[POST /presets] Error:', error);
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

// Get presets folder path and open in file explorer if possible
router.post('/presets/open-folder', async (req, res, next) => {
  try {
    const result = await presetService.openPresetsFolder();
    res.json({
      message: result.opened ? 'Opened presets folder' : 'Presets folder path',
      path: result.path,
      opened: result.opened,
    });
  } catch (error) {
    next(error);
  }
});

// Get folder contents
router.post('/presets/folder-contents', async (req, res, next) => {
  try {
    const { folderPath } = req.body;
    const result = await presetService.getFolderContents(folderPath);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// List available CM packs
router.get('/cm-packs', async (req, res, next) => {
  try {
    const packs = await presetService.listCMPacks();
    res.json({ packs });
  } catch (error) {
    next(error);
  }
});

// Import a CM pack
router.post('/cm-packs/import', async (req, res, next) => {
  try {
    const { filename, presetName } = req.body;
    const preset = await presetService.importCMPack(filename, presetName);
    res.json({ message: 'CM pack imported successfully', preset });
  } catch (error) {
    next(error);
  }
});

// Upload and import a CM pack from user's PC
router.post('/cm-packs/upload', async (req, res, next) => {
  try {
    const { fileData, fileName, presetName } = req.body;
    const preset = await presetService.uploadAndImportCMPack(fileData, fileName, presetName);
    res.json({ message: 'CM pack uploaded and imported successfully', preset });
  } catch (error) {
    next(error);
  }
});

// Delete a CM pack
router.delete('/cm-packs/:filename', async (req, res, next) => {
  try {
    await presetService.deleteCMPack(req.params.filename);
    res.json({ message: 'CM pack deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

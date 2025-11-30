import express from 'express';
import * as presetService from '../services/presetService.js';

const router = express.Router();

// GET /api/config/presets - List all presets
router.get('/', async (req, res) => {
  try {
    const presets = await presetService.getAllPresets();
    res.json({ presets });
  } catch (error) {
    console.error('Failed to get presets:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/presets - Save current config as preset
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const preset = await presetService.savePreset(name, description);
    res.json({ message: 'Preset saved', preset });
  } catch (error) {
    console.error('Failed to save preset:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/presets/:id/load - Load a preset
router.post('/:id/load', async (req, res) => {
  try {
    const { id } = req.params;
    await presetService.loadPreset(id);
    res.json({ message: 'Preset loaded successfully' });
  } catch (error) {
    console.error('Failed to load preset:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/presets/:id/duplicate - Duplicate a preset
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const newPreset = await presetService.duplicatePreset(id, name);
    res.json({ message: 'Preset duplicated', preset: newPreset });
  } catch (error) {
    console.error('Failed to duplicate preset:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/config/presets/:id - Rename a preset
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const preset = await presetService.renamePreset(id, name);
    res.json({ message: 'Preset renamed', preset });
  } catch (error) {
    console.error('Failed to rename preset:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/config/presets/:id - Delete a preset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await presetService.deletePreset(id);
    res.json({ message: 'Preset deleted' });
  } catch (error) {
    console.error('Failed to delete preset:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

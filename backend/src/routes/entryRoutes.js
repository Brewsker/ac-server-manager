import express from 'express';
import * as entryService from '../services/entryService.js';

const router = express.Router();

// Get all entries
router.get('/', async (req, res, next) => {
  try {
    const entries = await entryService.getEntries();
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// Add new entry
router.post('/', async (req, res, next) => {
  try {
    const result = await entryService.addEntry(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update entry
router.put('/:id', async (req, res, next) => {
  try {
    const result = await entryService.updateEntry(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete entry
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await entryService.deleteEntry(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

import express from 'express';
import * as serverService from '../services/serverService.js';

const router = express.Router();

// Get server status
router.get('/status', async (req, res, next) => {
  try {
    const status = await serverService.getServerStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Start AC server
router.post('/start', async (req, res, next) => {
  try {
    const result = await serverService.startServer();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Stop AC server
router.post('/stop', async (req, res, next) => {
  try {
    const result = await serverService.stopServer();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Restart AC server
router.post('/restart', async (req, res, next) => {
  try {
    const result = await serverService.restartServer();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get server logs
router.get('/logs', async (req, res, next) => {
  try {
    const logs = await serverService.getServerLogs(req.query.lines);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;

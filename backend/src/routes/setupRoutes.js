import express from 'express';
import * as setupService from '../services/setupService.js';

const router = express.Router();

// Get setup status
router.get('/status', async (req, res, next) => {
  try {
    const status = await setupService.getSetupStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Validate AC installation path
router.post('/validate', async (req, res, next) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ 
        error: 'AC installation path is required' 
      });
    }

    const validation = await setupService.validatePaths(path);
    res.json(validation);
  } catch (error) {
    next(error);
  }
});

// Save configuration
router.post('/configure', async (req, res, next) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ 
        error: 'AC installation path is required' 
      });
    }

    // Validate paths first
    const validation = await setupService.validatePaths(path);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid AC installation directory',
        details: validation.errors
      });
    }

    // Save to .env file
    const result = await setupService.updateEnvFile(validation.paths);
    
    res.json({
      success: true,
      message: 'Configuration saved! Please restart the server for changes to take effect.',
      paths: validation.paths
    });
  } catch (error) {
    next(error);
  }
});

// Auto-detect AC installation
router.get('/auto-detect', async (req, res, next) => {
  try {
    const detected = await setupService.autoDetectACInstall();
    
    if (detected) {
      res.json({
        found: true,
        path: detected,
        message: 'AC installation detected'
      });
    } else {
      res.json({
        found: false,
        message: 'Could not auto-detect AC installation. Please specify path manually.'
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

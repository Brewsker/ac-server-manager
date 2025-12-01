/**
 * Routes Index
 * 
 * Aggregates all route modules and configures the Express router.
 * 
 * @module routes
 */

const express = require('express');
const configRoutes = require('./configRoutes');
const serverRoutes = require('./serverRoutes');
const contentRoutes = require('./contentRoutes');
const entryListRoutes = require('./entryListRoutes');

const router = express.Router();

/**
 * Health check endpoint
 * 
 * @route GET /api/health
 * @desc Check API health status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API Information endpoint
 * 
 * @route GET /api
 * @desc Get API information
 */
router.get('/', (req, res) => {
  res.json({
    name: 'AC Server Manager API',
    version: '1.0.0',
    description: 'Web-based management interface for Assetto Corsa dedicated servers',
    endpoints: {
      health: '/api/health',
      configs: '/api/configs',
      server: '/api/server',
      content: '/api/content',
      entries: '/api/entries'
    }
  });
});

// Mount route modules
router.use('/configs', configRoutes);
router.use('/server', serverRoutes);
router.use('/content', contentRoutes);
router.use('/entries', entryListRoutes);

module.exports = router;

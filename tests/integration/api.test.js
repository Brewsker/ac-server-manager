/**
 * API Integration Tests
 * 
 * Integration tests for the REST API endpoints.
 * Tests HTTP requests and responses.
 * 
 * @module tests/integration/api.test
 */

const request = require('supertest');
const app = require('../../server/src/app');

describe('API Endpoints', () => {
  /**
   * Health Check Endpoint Tests
   */
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });
  });

  /**
   * API Info Endpoint Tests
   */
  describe('GET /api', () => {
    test('should return API information', async () => {
      const res = await request(app)
        .get('/api')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.name).toBe('AC Server Manager API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  /**
   * Configuration Endpoint Tests
   */
  describe('Configuration API', () => {
    describe('GET /api/configs', () => {
      test('should return array of configs', async () => {
        const res = await request(app)
          .get('/api/configs')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/configs/defaults', () => {
      test('should return default config values', async () => {
        const res = await request(app)
          .get('/api/configs/defaults')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('AC Server');
        expect(res.body.data.maxClients).toBe(16);
      });
    });

    describe('POST /api/configs', () => {
      test('should create a new config', async () => {
        const res = await request(app)
          .post('/api/configs')
          .send({
            name: 'Test Server',
            track: 'spa',
            maxClients: 20
          })
          .expect('Content-Type', /json/)
          .expect(201);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Test Server');
        expect(res.body.data.track).toBe('spa');
        expect(res.body.data.id).toBeDefined();
      });

      test('should validate config values', async () => {
        const res = await request(app)
          .post('/api/configs')
          .send({
            maxClients: 100 // Invalid - max is 24
          })
          .expect('Content-Type', /json/)
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/configs/:id', () => {
      test('should return 404 for non-existent config', async () => {
        const res = await request(app)
          .get('/api/configs/non-existent-id')
          .expect('Content-Type', /json/)
          .expect(404);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  /**
   * Server Control Endpoint Tests
   */
  describe('Server Control API', () => {
    describe('GET /api/server/status', () => {
      test('should return server status', async () => {
        const res = await request(app)
          .get('/api/server/status')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.state).toBeDefined();
        expect(res.body.data.isRunning).toBeDefined();
      });
    });

    describe('POST /api/server/start', () => {
      test('should return error when no config exists', async () => {
        const res = await request(app)
          .post('/api/server/start')
          .send({})
          .expect('Content-Type', /json/);
        
        // Should fail because there's no config
        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /api/server/stop', () => {
      test('should return error when server not running', async () => {
        const res = await request(app)
          .post('/api/server/stop')
          .send({})
          .expect('Content-Type', /json/)
          .expect(409);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('CONFLICT');
      });
    });
  });

  /**
   * Content Endpoint Tests
   */
  describe('Content API', () => {
    describe('GET /api/content/tracks', () => {
      test('should return array of tracks', async () => {
        const res = await request(app)
          .get('/api/content/tracks')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/content/cars', () => {
      test('should return array of cars', async () => {
        const res = await request(app)
          .get('/api/content/cars')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/content/tracks/search', () => {
      test('should search tracks', async () => {
        const res = await request(app)
          .get('/api/content/tracks/search')
          .query({ q: 'spa' })
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });
  });

  /**
   * Entry List Endpoint Tests
   */
  describe('Entry List API', () => {
    describe('GET /api/entries', () => {
      test('should return array of entry lists', async () => {
        const res = await request(app)
          .get('/api/entries')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('POST /api/entries', () => {
      test('should create a new entry list', async () => {
        const res = await request(app)
          .post('/api/entries')
          .send({
            entries: [
              { model: 'ferrari_458', skin: 'red' },
              { model: 'bmw_m3', skin: 'blue' }
            ]
          })
          .expect('Content-Type', /json/)
          .expect(201);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.entries).toHaveLength(2);
      });

      test('should validate entry list', async () => {
        const res = await request(app)
          .post('/api/entries')
          .send({
            entries: [] // Invalid - at least one entry required
          })
          .expect('Content-Type', /json/)
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/non-existent-route')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('should handle invalid JSON', async () => {
      const res = await request(app)
        .post('/api/configs')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });
});

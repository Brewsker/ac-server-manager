/**
 * ServerConfig Model Tests
 * 
 * Unit tests for the ServerConfig model class.
 * Tests configuration creation, validation, and serialization.
 * 
 * @module tests/unit/ServerConfig.test
 */

const ServerConfig = require('../../server/src/models/ServerConfig');

describe('ServerConfig', () => {
  /**
   * Test default configuration creation
   */
  describe('constructor', () => {
    test('should create config with default values', () => {
      const config = new ServerConfig();
      
      expect(config.id).toBeDefined();
      expect(config.config.name).toBe('AC Server');
      expect(config.config.maxClients).toBe(16);
      expect(config.config.track).toBe('imola');
    });

    test('should create config with custom values', () => {
      const config = new ServerConfig({
        name: 'My Server',
        maxClients: 20,
        track: 'spa'
      });
      
      expect(config.config.name).toBe('My Server');
      expect(config.config.maxClients).toBe(20);
      expect(config.config.track).toBe('spa');
    });

    test('should generate unique IDs', () => {
      const config1 = new ServerConfig();
      const config2 = new ServerConfig();
      
      expect(config1.id).not.toBe(config2.id);
    });

    test('should use provided ID', () => {
      const customId = 'custom-id-123';
      const config = new ServerConfig({ id: customId });
      
      expect(config.id).toBe(customId);
    });
  });

  /**
   * Test getter and setter methods
   */
  describe('getters and setters', () => {
    test('should get server name', () => {
      const config = new ServerConfig({ name: 'Test Server' });
      expect(config.name).toBe('Test Server');
    });

    test('should set server name and update timestamp', () => {
      const config = new ServerConfig();
      const originalUpdatedAt = config.updatedAt;
      
      // Small delay to ensure timestamp changes
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      
      config.name = 'Updated Server';
      
      expect(config.name).toBe('Updated Server');
      jest.useRealTimers();
    });

    test('should get and set track', () => {
      const config = new ServerConfig();
      config.track = 'monza';
      
      expect(config.track).toBe('monza');
    });
  });

  /**
   * Test update method
   */
  describe('update', () => {
    test('should update multiple values', () => {
      const config = new ServerConfig();
      
      config.update({
        name: 'Updated Server',
        maxClients: 24,
        track: 'nurburgring'
      });
      
      expect(config.config.name).toBe('Updated Server');
      expect(config.config.maxClients).toBe(24);
      expect(config.config.track).toBe('nurburgring');
    });

    test('should ignore unknown properties', () => {
      const config = new ServerConfig();
      
      config.update({
        unknownProp: 'value'
      });
      
      expect(config.config.unknownProp).toBeUndefined();
    });

    test('should return self for chaining', () => {
      const config = new ServerConfig();
      const result = config.update({ name: 'Test' });
      
      expect(result).toBe(config);
    });
  });

  /**
   * Test validation
   */
  describe('validate', () => {
    test('should pass with valid config', () => {
      const config = new ServerConfig({
        name: 'Valid Server',
        maxClients: 16,
        track: 'spa'
      });
      
      const result = config.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail with empty name', () => {
      const config = new ServerConfig({ name: '' });
      const result = config.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server name is required');
    });

    test('should fail with invalid maxClients', () => {
      const config = new ServerConfig({ maxClients: 30 });
      const result = config.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max clients must be between 1 and 24');
    });

    test('should fail with invalid ports', () => {
      const config = new ServerConfig({ 
        udpPort: 100, 
        tcpPort: 70000 
      });
      const result = config.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UDP port must be between 1024 and 65535');
      expect(result.errors).toContain('TCP port must be between 1024 and 65535');
    });

    test('should fail with empty track', () => {
      const config = new ServerConfig({ track: '' });
      const result = config.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Track is required');
    });
  });

  /**
   * Test INI serialization
   */
  describe('toINI', () => {
    test('should generate valid INI format', () => {
      const config = new ServerConfig({
        name: 'Test Server',
        track: 'spa',
        maxClients: 20
      });
      
      const ini = config.toINI();
      
      expect(ini).toContain('[SERVER]');
      expect(ini).toContain('NAME=Test Server');
      expect(ini).toContain('TRACK=spa');
      expect(ini).toContain('MAX_CLIENTS=20');
      expect(ini).toContain('[PRACTICE]');
      expect(ini).toContain('[QUALIFY]');
      expect(ini).toContain('[RACE]');
    });
  });

  /**
   * Test INI parsing
   */
  describe('fromINI', () => {
    test('should parse INI string correctly', () => {
      const iniString = `
[SERVER]
NAME=Parsed Server
PASSWORD=secret
MAX_CLIENTS=18
TRACK=monza
UDP_PORT=9600

[PRACTICE]
TIME=15

[QUALIFY]
TIME=20

[RACE]
LAPS=10
      `;
      
      const config = ServerConfig.fromINI(iniString);
      
      expect(config.config.name).toBe('Parsed Server');
      expect(config.config.password).toBe('secret');
      expect(config.config.maxClients).toBe(18);
      expect(config.config.track).toBe('monza');
      expect(config.config.practiceTime).toBe(15);
      expect(config.config.qualifyTime).toBe(20);
      expect(config.config.raceLaps).toBe(10);
    });
  });

  /**
   * Test JSON serialization
   */
  describe('toJSON', () => {
    test('should convert to JSON object', () => {
      const config = new ServerConfig({
        name: 'JSON Test',
        track: 'spa'
      });
      
      const json = config.toJSON();
      
      expect(json.id).toBe(config.id);
      expect(json.name).toBe('JSON Test');
      expect(json.track).toBe('spa');
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
    });
  });

  /**
   * Test static methods
   */
  describe('static methods', () => {
    test('getDefaults should return default config values', () => {
      const defaults = ServerConfig.getDefaults();
      
      expect(defaults.name).toBe('AC Server');
      expect(defaults.maxClients).toBe(16);
      expect(defaults.udpPort).toBe(9600);
    });

    test('fromJSON should create config from object', () => {
      const obj = {
        id: 'test-id',
        name: 'From JSON',
        track: 'nurburgring'
      };
      
      const config = ServerConfig.fromJSON(obj);
      
      expect(config.id).toBe('test-id');
      expect(config.config.name).toBe('From JSON');
      expect(config.config.track).toBe('nurburgring');
    });
  });
});

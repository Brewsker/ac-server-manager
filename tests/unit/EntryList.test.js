/**
 * EntryList Model Tests
 * 
 * Unit tests for the Entry and EntryList model classes.
 * Tests entry management and serialization.
 * 
 * @module tests/unit/EntryList.test
 */

const { Entry, EntryList } = require('../../server/src/models/EntryList');

describe('Entry', () => {
  /**
   * Test entry creation
   */
  describe('constructor', () => {
    test('should create entry with default values', () => {
      const entry = new Entry();
      
      expect(entry.id).toBeDefined();
      expect(entry.model).toBe('');
      expect(entry.skin).toBe('');
      expect(entry.ballast).toBe(0);
    });

    test('should create entry with custom values', () => {
      const entry = new Entry({
        model: 'ferrari_458',
        skin: 'red',
        driverName: 'Test Driver',
        ballast: 50
      });
      
      expect(entry.model).toBe('ferrari_458');
      expect(entry.skin).toBe('red');
      expect(entry.driverName).toBe('Test Driver');
      expect(entry.ballast).toBe(50);
    });
  });

  /**
   * Test entry validation
   */
  describe('validate', () => {
    test('should pass with valid entry', () => {
      const entry = new Entry({ model: 'ferrari_458' });
      const result = entry.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail with empty model', () => {
      const entry = new Entry();
      const result = entry.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Car model is required');
    });

    test('should fail with invalid ballast', () => {
      const entry = new Entry({ 
        model: 'ferrari_458',
        ballast: 200 
      });
      const result = entry.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ballast must be between 0 and 150 kg');
    });

    test('should fail with invalid restrictor', () => {
      const entry = new Entry({ 
        model: 'ferrari_458',
        restrictor: 150 
      });
      const result = entry.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Restrictor must be between 0 and 100%');
    });
  });

  /**
   * Test INI serialization
   */
  describe('toINI', () => {
    test('should generate valid INI section', () => {
      const entry = new Entry({
        model: 'ferrari_458',
        skin: 'red',
        driverName: 'Driver 1'
      });
      
      const ini = entry.toINI(0);
      
      expect(ini).toContain('[CAR_0]');
      expect(ini).toContain('MODEL=ferrari_458');
      expect(ini).toContain('SKIN=red');
      expect(ini).toContain('DRIVERNAME=Driver 1');
    });

    test('should use correct index', () => {
      const entry = new Entry({ model: 'bmw_m3' });
      const ini = entry.toINI(5);
      
      expect(ini).toContain('[CAR_5]');
    });
  });

  /**
   * Test JSON serialization
   */
  describe('toJSON', () => {
    test('should convert to JSON object', () => {
      const entry = new Entry({
        model: 'porsche_911',
        skin: 'white',
        team: 'Team A'
      });
      
      const json = entry.toJSON();
      
      expect(json.id).toBeDefined();
      expect(json.model).toBe('porsche_911');
      expect(json.skin).toBe('white');
      expect(json.team).toBe('Team A');
    });
  });
});

describe('EntryList', () => {
  /**
   * Test entry list creation
   */
  describe('constructor', () => {
    test('should create empty entry list', () => {
      const entryList = new EntryList();
      
      expect(entryList.id).toBeDefined();
      expect(entryList.entries).toHaveLength(0);
      expect(entryList.count).toBe(0);
    });

    test('should create entry list with entries', () => {
      const entryList = new EntryList({
        entries: [
          { model: 'ferrari_458' },
          { model: 'bmw_m3' }
        ]
      });
      
      expect(entryList.count).toBe(2);
      expect(entryList.entries[0].model).toBe('ferrari_458');
      expect(entryList.entries[1].model).toBe('bmw_m3');
    });
  });

  /**
   * Test computed properties
   */
  describe('computed properties', () => {
    test('count should return number of entries', () => {
      const entryList = new EntryList({
        entries: [
          { model: 'car1' },
          { model: 'car2' },
          { model: 'car3' }
        ]
      });
      
      expect(entryList.count).toBe(3);
    });

    test('cars should return unique car models', () => {
      const entryList = new EntryList({
        entries: [
          { model: 'ferrari_458' },
          { model: 'bmw_m3' },
          { model: 'ferrari_458' }
        ]
      });
      
      const cars = entryList.cars;
      
      expect(cars).toHaveLength(2);
      expect(cars).toContain('ferrari_458');
      expect(cars).toContain('bmw_m3');
    });
  });

  /**
   * Test entry management
   */
  describe('entry management', () => {
    test('addEntry should add new entry', () => {
      const entryList = new EntryList();
      
      const entry = entryList.addEntry({ model: 'ferrari_458' });
      
      expect(entryList.count).toBe(1);
      expect(entry.model).toBe('ferrari_458');
    });

    test('removeEntry should remove entry by ID', () => {
      const entryList = new EntryList({
        entries: [{ model: 'ferrari_458' }]
      });
      const entryId = entryList.entries[0].id;
      
      const removed = entryList.removeEntry(entryId);
      
      expect(removed).toBe(true);
      expect(entryList.count).toBe(0);
    });

    test('removeEntry should return false for non-existent ID', () => {
      const entryList = new EntryList();
      const removed = entryList.removeEntry('non-existent');
      
      expect(removed).toBe(false);
    });

    test('updateEntry should update entry by ID', () => {
      const entryList = new EntryList({
        entries: [{ model: 'ferrari_458' }]
      });
      const entryId = entryList.entries[0].id;
      
      const updated = entryList.updateEntry(entryId, { skin: 'blue' });
      
      expect(updated.skin).toBe('blue');
      expect(entryList.entries[0].skin).toBe('blue');
    });

    test('updateEntry should return null for non-existent ID', () => {
      const entryList = new EntryList();
      const updated = entryList.updateEntry('non-existent', { skin: 'blue' });
      
      expect(updated).toBeNull();
    });

    test('getEntry should return entry by ID', () => {
      const entryList = new EntryList({
        entries: [{ model: 'ferrari_458' }]
      });
      const entryId = entryList.entries[0].id;
      
      const entry = entryList.getEntry(entryId);
      
      expect(entry.model).toBe('ferrari_458');
    });

    test('clear should remove all entries', () => {
      const entryList = new EntryList({
        entries: [
          { model: 'car1' },
          { model: 'car2' }
        ]
      });
      
      entryList.clear();
      
      expect(entryList.count).toBe(0);
    });
  });

  /**
   * Test validation
   */
  describe('validate', () => {
    test('should pass with valid entries', () => {
      const entryList = new EntryList({
        entries: [
          { model: 'ferrari_458' },
          { model: 'bmw_m3' }
        ]
      });
      
      const result = entryList.validate();
      
      expect(result.isValid).toBe(true);
    });

    test('should fail with empty entry list', () => {
      const entryList = new EntryList();
      const result = entryList.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one entry is required');
    });

    test('should aggregate entry validation errors', () => {
      const entryList = new EntryList({
        entries: [{ model: '' }]
      });
      
      const result = entryList.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Entry 1'))).toBe(true);
    });
  });

  /**
   * Test INI serialization
   */
  describe('toINI', () => {
    test('should generate valid INI format', () => {
      const entryList = new EntryList({
        entries: [
          { model: 'ferrari_458', skin: 'red' },
          { model: 'bmw_m3', skin: 'blue' }
        ]
      });
      
      const ini = entryList.toINI();
      
      expect(ini).toContain('[CAR_0]');
      expect(ini).toContain('MODEL=ferrari_458');
      expect(ini).toContain('[CAR_1]');
      expect(ini).toContain('MODEL=bmw_m3');
    });
  });

  /**
   * Test INI parsing
   */
  describe('fromINI', () => {
    test('should parse INI string correctly', () => {
      const iniString = `
[CAR_0]
MODEL=ferrari_458
SKIN=red
DRIVERNAME=Driver 1
BALLAST=0

[CAR_1]
MODEL=bmw_m3
SKIN=blue
DRIVERNAME=Driver 2
BALLAST=20
      `;
      
      const entryList = EntryList.fromINI(iniString);
      
      expect(entryList.count).toBe(2);
      expect(entryList.entries[0].model).toBe('ferrari_458');
      expect(entryList.entries[1].model).toBe('bmw_m3');
      expect(entryList.entries[1].ballast).toBe(20);
    });
  });

  /**
   * Test JSON serialization
   */
  describe('toJSON', () => {
    test('should convert to JSON object', () => {
      const entryList = new EntryList({
        entries: [{ model: 'ferrari_458' }]
      });
      
      const json = entryList.toJSON();
      
      expect(json.id).toBeDefined();
      expect(json.entries).toHaveLength(1);
      expect(json.count).toBe(1);
      expect(json.cars).toContain('ferrari_458');
    });
  });

  /**
   * Test static methods
   */
  describe('static methods', () => {
    test('fromJSON should create entry list from object', () => {
      const obj = {
        id: 'test-id',
        entries: [{ model: 'ferrari_458' }]
      };
      
      const entryList = EntryList.fromJSON(obj);
      
      expect(entryList.id).toBe('test-id');
      expect(entryList.count).toBe(1);
    });
  });
});

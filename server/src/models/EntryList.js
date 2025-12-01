/**
 * Entry List Model
 * 
 * Represents the Assetto Corsa entry list (entry_list.ini).
 * Manages car/driver entries for the server.
 * 
 * @module models/EntryList
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Default entry values
 * @constant {Object}
 */
const DEFAULT_ENTRY = {
  model: '',
  skin: '',
  driverName: '',
  team: '',
  guid: '',
  spectatorMode: 0,
  ballast: 0,
  restrictor: 0,
  fixedSetup: ''
};

/**
 * Entry class
 * 
 * Represents a single car/driver entry in the entry list.
 */
class Entry {
  /**
   * Creates a new Entry instance
   * 
   * @param {Object} data - Entry data
   * @param {string} data.model - Car model name
   * @param {string} data.skin - Car skin name
   * @param {string} [data.driverName] - Driver name
   * @param {string} [data.team] - Team name
   * @param {string} [data.guid] - Steam GUID for reserved slot
   */
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.model = data.model || DEFAULT_ENTRY.model;
    this.skin = data.skin || DEFAULT_ENTRY.skin;
    this.driverName = data.driverName || DEFAULT_ENTRY.driverName;
    this.team = data.team || DEFAULT_ENTRY.team;
    this.guid = data.guid || DEFAULT_ENTRY.guid;
    this.spectatorMode = data.spectatorMode || DEFAULT_ENTRY.spectatorMode;
    this.ballast = data.ballast || DEFAULT_ENTRY.ballast;
    this.restrictor = data.restrictor || DEFAULT_ENTRY.restrictor;
    this.fixedSetup = data.fixedSetup || DEFAULT_ENTRY.fixedSetup;
  }

  /**
   * Validate the entry
   * 
   * @returns {Object} Validation result with isValid and errors array
   */
  validate() {
    const errors = [];

    if (!this.model || this.model.trim().length === 0) {
      errors.push('Car model is required');
    }

    if (this.ballast < 0 || this.ballast > 150) {
      errors.push('Ballast must be between 0 and 150 kg');
    }

    if (this.restrictor < 0 || this.restrictor > 100) {
      errors.push('Restrictor must be between 0 and 100%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert entry to INI section format
   * 
   * @param {number} index - Entry index (0-based)
   * @returns {string} INI section string
   */
  toINI(index) {
    const lines = [
      `[CAR_${index}]`,
      `MODEL=${this.model}`,
      `SKIN=${this.skin}`,
      `DRIVERNAME=${this.driverName}`,
      `TEAM=${this.team}`,
      `GUID=${this.guid}`,
      `SPECTATOR_MODE=${this.spectatorMode}`,
      `BALLAST=${this.ballast}`,
      `RESTRICTOR=${this.restrictor}`,
      `FIXED_SETUP=${this.fixedSetup}`
    ];
    return lines.join('\n');
  }

  /**
   * Convert to plain object
   * 
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      model: this.model,
      skin: this.skin,
      driverName: this.driverName,
      team: this.team,
      guid: this.guid,
      spectatorMode: this.spectatorMode,
      ballast: this.ballast,
      restrictor: this.restrictor,
      fixedSetup: this.fixedSetup
    };
  }
}

/**
 * EntryList class
 * 
 * Manages a collection of car/driver entries for the AC server.
 */
class EntryList {
  /**
   * Creates a new EntryList instance
   * 
   * @param {Object} data - Entry list data
   * @param {Array} [data.entries] - Array of entry objects
   */
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.entries = (data.entries || []).map(e => 
      e instanceof Entry ? e : new Entry(e)
    );
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get number of entries
   * @returns {number} Entry count
   */
  get count() {
    return this.entries.length;
  }

  /**
   * Get unique car models in the entry list
   * @returns {string[]} Array of unique car models
   */
  get cars() {
    return [...new Set(this.entries.map(e => e.model))];
  }

  /**
   * Add a new entry
   * 
   * @param {Object|Entry} entry - Entry to add
   * @returns {Entry} The added entry
   */
  addEntry(entry) {
    const newEntry = entry instanceof Entry ? entry : new Entry(entry);
    this.entries.push(newEntry);
    this.markUpdated();
    return newEntry;
  }

  /**
   * Remove an entry by ID
   * 
   * @param {string} id - Entry ID to remove
   * @returns {boolean} True if entry was removed
   */
  removeEntry(id) {
    const index = this.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entries.splice(index, 1);
      this.markUpdated();
      return true;
    }
    return false;
  }

  /**
   * Update an entry by ID
   * 
   * @param {string} id - Entry ID to update
   * @param {Object} updates - Update data
   * @returns {Entry|null} Updated entry or null if not found
   */
  updateEntry(id, updates) {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      Object.assign(entry, updates);
      this.markUpdated();
      return entry;
    }
    return null;
  }

  /**
   * Get an entry by ID
   * 
   * @param {string} id - Entry ID
   * @returns {Entry|undefined} Entry or undefined
   */
  getEntry(id) {
    return this.entries.find(e => e.id === id);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
    this.markUpdated();
  }

  /**
   * Mark as updated
   * @private
   */
  markUpdated() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validate all entries
   * 
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];

    if (this.entries.length === 0) {
      errors.push('At least one entry is required');
    }

    this.entries.forEach((entry, index) => {
      const result = entry.validate();
      if (!result.isValid) {
        errors.push(...result.errors.map(e => `Entry ${index + 1}: ${e}`));
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to INI format string
   * 
   * @returns {string} INI formatted string
   */
  toINI() {
    return this.entries.map((entry, index) => entry.toINI(index)).join('\n\n');
  }

  /**
   * Create EntryList from INI string
   * 
   * @static
   * @param {string} iniString - INI formatted string
   * @returns {EntryList} New EntryList instance
   */
  static fromINI(iniString) {
    const ini = require('ini');
    const parsed = ini.parse(iniString);
    
    const entries = [];
    let index = 0;

    // Parse CAR_X sections
    while (parsed[`CAR_${index}`]) {
      const section = parsed[`CAR_${index}`];
      entries.push({
        model: section.MODEL || '',
        skin: section.SKIN || '',
        driverName: section.DRIVERNAME || '',
        team: section.TEAM || '',
        guid: section.GUID || '',
        spectatorMode: parseInt(section.SPECTATOR_MODE, 10) || 0,
        ballast: parseInt(section.BALLAST, 10) || 0,
        restrictor: parseInt(section.RESTRICTOR, 10) || 0,
        fixedSetup: section.FIXED_SETUP || ''
      });
      index++;
    }

    return new EntryList({ entries });
  }

  /**
   * Convert to plain object
   * 
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      entries: this.entries.map(e => e.toJSON()),
      count: this.count,
      cars: this.cars,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create EntryList from plain object
   * 
   * @static
   * @param {Object} obj - Plain object
   * @returns {EntryList} New EntryList instance
   */
  static fromJSON(obj) {
    return new EntryList(obj);
  }
}

module.exports = { Entry, EntryList };

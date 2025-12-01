import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as configStateManager from './configStateManager.js';

const PRESETS_DIR = path.join(process.cwd(), 'data', 'presets');
const PRESETS_INDEX = path.join(PRESETS_DIR, 'index.json');

// Ensure presets directory exists
async function ensurePresetsDir() {
  try {
    await fs.mkdir(PRESETS_DIR, { recursive: true });

    // Create index file if it doesn't exist
    try {
      await fs.access(PRESETS_INDEX);
    } catch {
      await fs.writeFile(PRESETS_INDEX, JSON.stringify({ presets: [] }, null, 2));
    }
  } catch (error) {
    console.error('Failed to create presets directory:', error);
    throw error;
  }
}

// Read presets index
async function readPresetsIndex() {
  await ensurePresetsDir();
  const data = await fs.readFile(PRESETS_INDEX, 'utf-8');
  return JSON.parse(data);
}

// Write presets index
async function writePresetsIndex(data) {
  await ensurePresetsDir();
  await fs.writeFile(PRESETS_INDEX, JSON.stringify(data, null, 2));
}

// Get all presets
export async function getAllPresets() {
  const index = await readPresetsIndex();
  return index.presets || [];
}

// Save current working configuration as a preset
export async function savePreset(name, description = '') {
  await ensurePresetsDir();

  const currentConfig = await configStateManager.getWorkingConfig();
  const id = uuidv4();

  // Extract metadata from config
  const metadata = {
    track: currentConfig.SERVER?.TRACK || 'Unknown',
    cars: Array.isArray(currentConfig.SERVER?.CARS)
      ? currentConfig.SERVER.CARS.length
      : currentConfig.SERVER?.CARS?.split(';').length || 0,
    maxClients: currentConfig.SERVER?.MAX_CLIENTS || 0,
    sessions:
      [
        currentConfig.PRACTICE?.TIME ? 'Practice' : null,
        currentConfig.QUALIFY?.TIME ? 'Qualify' : null,
        currentConfig.RACE?.TIME || currentConfig.RACE?.LAPS ? 'Race' : null,
      ]
        .filter(Boolean)
        .join(', ') || 'None',
  };

  const preset = {
    id,
    name,
    description,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    ...metadata,
  };

  // Save config file
  const configPath = path.join(PRESETS_DIR, `${id}.json`);
  await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2));

  // Update index
  const index = await readPresetsIndex();
  index.presets.push(preset);
  await writePresetsIndex(index);

  return preset;
}

// Load a preset into working config (doesn't apply to server yet)
export async function loadPreset(id) {
  console.log(`[loadPreset] Loading preset: ${id}`);

  // Read preset config from file
  const configPath = path.join(PRESETS_DIR, `${id}.json`);
  const configData = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configData);

  console.log(`[loadPreset] Loaded config from file, loading to working config...`);

  // Load into working config (user can edit before applying)
  await configStateManager.loadPresetToWorking(config);

  console.log(`[loadPreset] Preset loaded to working config`);
  return config;
}

// Duplicate a preset
export async function duplicatePreset(id, newName) {
  const index = await readPresetsIndex();
  const originalPreset = index.presets.find((p) => p.id === id);

  if (!originalPreset) {
    throw new Error('Preset not found');
  }

  // Read original config
  const originalConfigPath = path.join(PRESETS_DIR, `${id}.json`);
  const configData = await fs.readFile(originalConfigPath, 'utf-8');
  const config = JSON.parse(configData);

  // Create new preset
  const newId = uuidv4();
  const newPreset = {
    ...originalPreset,
    id: newId,
    name: newName,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  // Save new config file
  const newConfigPath = path.join(PRESETS_DIR, `${newId}.json`);
  await fs.writeFile(newConfigPath, JSON.stringify(config, null, 2));

  // Update index
  index.presets.push(newPreset);
  await writePresetsIndex(index);

  return newPreset;
}

// Rename a preset
export async function renamePreset(id, newName) {
  const index = await readPresetsIndex();
  const preset = index.presets.find((p) => p.id === id);

  if (!preset) {
    throw new Error('Preset not found');
  }

  // Update preset name in index
  preset.name = newName;
  preset.modified = new Date().toISOString();

  // Also update SERVER.NAME in the preset's config file to match
  const configPath = path.join(PRESETS_DIR, `${id}.json`);
  const configData = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configData);

  if (config.SERVER) {
    config.SERVER.NAME = newName;
  }

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  await writePresetsIndex(index);

  return preset;
}

// Delete a preset
export async function deletePreset(id) {
  const index = await readPresetsIndex();
  const presetIndex = index.presets.findIndex((p) => p.id === id);

  if (presetIndex === -1) {
    throw new Error('Preset not found');
  }

  // Delete config file
  const configPath = path.join(PRESETS_DIR, `${id}.json`);
  await fs.unlink(configPath);

  // Update index
  index.presets.splice(presetIndex, 1);
  await writePresetsIndex(index);
}

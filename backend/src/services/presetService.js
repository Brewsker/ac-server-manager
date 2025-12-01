import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as configStateManager from './configStateManager.js';
import { parseIniFile } from '../utils/iniParser.js';

const PRESETS_DIR = path.join(process.cwd(), 'data', 'presets');
const PRESETS_INDEX = path.join(PRESETS_DIR, 'index.json');
const CM_PACKS_DIR = path.join(process.cwd(), 'data', 'cm-packs');

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

// Get presets folder path and optionally open in file explorer
export async function openPresetsFolder() {
  await ensurePresetsDir();

  // Get the data folder which contains all config files
  const dataDir = path.resolve(PRESETS_DIR, '..');

  // Check if we're in a headless environment
  const isHeadless =
    !process.env.DISPLAY && process.platform !== 'win32' && process.platform !== 'darwin';

  if (!isHeadless) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const platform = process.platform;

    try {
      if (platform === 'win32') {
        // Use explorer.exe directly on Windows
        await execAsync(`explorer.exe "${dataDir}"`);
      } else if (platform === 'darwin') {
        await execAsync(`open "${dataDir}"`);
      } else {
        await execAsync(`xdg-open "${dataDir}"`);
      }
    } catch (error) {
      console.error('Failed to open presets folder:', error);
      // Don't throw - return the path instead
    }
  }

  return { path: dataDir, opened: !isHeadless };
}

// Get folder contents
export async function getFolderContents(folderPath) {
  const targetPath = folderPath || path.resolve(PRESETS_DIR, '..');

  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(targetPath, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: entry.isFile() ? stats.size : null,
          };
        } catch {
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: null,
          };
        }
      })
    );

    // Sort directories first, then files, both alphabetically
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return { files, path: targetPath };
  } catch (error) {
    console.error('Failed to read folder contents:', error);
    throw new Error('Failed to read folder contents');
  }
}

// List available CM packs for import
export async function listCMPacks() {
  try {
    await fs.mkdir(CM_PACKS_DIR, { recursive: true });
    const files = await fs.readdir(CM_PACKS_DIR);

    const packs = files
      .filter((file) => file.endsWith('.zip') || file.endsWith('.tar.gz') || file.endsWith('.tgz'))
      .map((file) => ({
        filename: file,
        name: file.replace(/\.(zip|tar\.gz|tgz)$/, ''),
        path: path.join(CM_PACKS_DIR, file),
      }));

    return packs;
  } catch (error) {
    console.error('Failed to list CM packs:', error);
    throw new Error('Failed to list CM packs');
  }
}

// Import a CM pack and convert to preset
export async function importCMPack(filename, presetName) {
  try {
    const packPath = path.join(CM_PACKS_DIR, filename);

    // Check if file exists
    try {
      await fs.access(packPath);
    } catch {
      throw new Error('Pack file not found');
    }

    // Extract the archive
    const extractPath = path.join(CM_PACKS_DIR, 'temp', uuidv4());
    await fs.mkdir(extractPath, { recursive: true });

    // Handle different archive formats
    if (filename.endsWith('.zip')) {
      const { default: AdmZip } = await import('adm-zip');
      const zip = new AdmZip(packPath);
      zip.extractAllTo(extractPath, true);
    } else if (filename.endsWith('.tar.gz') || filename.endsWith('.tgz')) {
      const tar = await import('tar');
      await tar.default.extract({
        file: packPath,
        cwd: extractPath,
      });
    } else {
      throw new Error('Unsupported archive format. Use .zip, .tar.gz, or .tgz');
    }

    // Debug: List extracted files
    console.log('[importCMPack] Extraction complete. Listing contents...');
    const extractedFiles = await fs.readdir(extractPath, { recursive: true });
    console.log('[importCMPack] Extracted files:', extractedFiles);

    // Read server_cfg.ini (might be in a subdirectory)
    let serverCfgPath = path.join(extractPath, 'server_cfg.ini');

    // Check if server_cfg.ini is in the root
    try {
      await fs.access(serverCfgPath);
    } catch {
      // Look for server_cfg.ini in subdirectories
      console.log('[importCMPack] server_cfg.ini not in root, searching subdirectories...');
      const foundPath = extractedFiles.find((f) => f.endsWith('server_cfg.ini'));
      if (foundPath) {
        serverCfgPath = path.join(extractPath, foundPath);
        console.log('[importCMPack] Found server_cfg.ini at:', foundPath);
      } else {
        throw new Error('Invalid CM pack: server_cfg.ini not found');
      }
    }

    const serverCfgContent = await fs.readFile(serverCfgPath, 'utf-8');
    const serverConfig = parseIniFile(serverCfgContent);

    // Read entry_list.ini if exists (check same directory as server_cfg.ini)
    const serverCfgDir = path.dirname(serverCfgPath);
    const entryListPath = path.join(serverCfgDir, 'entry_list.ini');
    let entryConfig = {};

    try {
      await fs.access(entryListPath);
      const entryListContent = await fs.readFile(entryListPath, 'utf-8');
      entryConfig = parseIniFile(entryListContent);
    } catch {
      console.log('No entry_list.ini found in pack');
    }

    // Combine configs
    const combinedConfig = {
      ...serverConfig,
      ...entryConfig,
    };

    // Override server name if provided
    if (presetName && combinedConfig.SERVER) {
      combinedConfig.SERVER.NAME = presetName;
    }

    // Extract metadata
    const metadata = {
      track: combinedConfig.SERVER?.TRACK || 'Unknown',
      cars: Array.isArray(combinedConfig.SERVER?.CARS)
        ? combinedConfig.SERVER.CARS.length
        : combinedConfig.SERVER?.CARS?.split(';').filter((c) => c.trim()).length || 0,
      maxClients: combinedConfig.SERVER?.MAX_CLIENTS || 0,
      sessions:
        [
          combinedConfig.PRACTICE?.TIME ? 'Practice' : null,
          combinedConfig.QUALIFY?.TIME ? 'Qualify' : null,
          combinedConfig.RACE?.TIME || combinedConfig.RACE?.LAPS ? 'Race' : null,
        ]
          .filter(Boolean)
          .join(', ') || 'None',
    };

    // Create preset
    const id = uuidv4();
    const preset = {
      id,
      name:
        presetName || combinedConfig.SERVER?.NAME || filename.replace(/\.(zip|tar\.gz|tgz)$/, ''),
      description: `Imported from CM pack: ${filename}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      ...metadata,
    };

    // Save config file
    const configPath = path.join(PRESETS_DIR, `${id}.json`);
    await fs.writeFile(configPath, JSON.stringify(combinedConfig, null, 2));

    // Update index
    const index = await readPresetsIndex();
    index.presets.push(preset);
    await writePresetsIndex(index);

    // Cleanup temp files
    try {
      await fs.rm(extractPath, { recursive: true, force: true });
      console.log('[importCMPack] Cleanup successful');
    } catch (cleanupError) {
      console.error('[importCMPack] Cleanup failed (non-fatal):', cleanupError);
      // Don't throw - import succeeded
    }

    console.log('[importCMPack] Import completed successfully:', preset.id);
    return preset;
  } catch (error) {
    console.error('[importCMPack] Failed to import CM pack:', error);
    throw error;
  }
}

// Upload and import a CM pack from user's PC
export async function uploadAndImportCMPack(fileData, fileName, presetName) {
  try {
    console.log('[uploadAndImportCMPack] Starting upload for:', fileName);

    // Save uploaded file to cm-packs directory
    await fs.mkdir(CM_PACKS_DIR, { recursive: true });

    // Decode base64 file data
    const buffer = Buffer.from(fileData, 'base64');
    const uploadPath = path.join(CM_PACKS_DIR, fileName);

    console.log('[uploadAndImportCMPack] Writing file to:', uploadPath);
    await fs.writeFile(uploadPath, buffer);
    console.log('[uploadAndImportCMPack] File saved successfully');

    // Now import it using the existing import function
    const preset = await importCMPack(fileName, presetName);

    console.log('[uploadAndImportCMPack] Upload and import completed successfully');
    return preset;
  } catch (error) {
    console.error('[uploadAndImportCMPack] Failed to upload and import CM pack:', error);
    throw error;
  }
}

// Delete a CM pack file
export async function deleteCMPack(filename) {
  try {
    const packPath = path.join(CM_PACKS_DIR, filename);
    await fs.unlink(packPath);
  } catch (error) {
    console.error('Failed to delete CM pack:', error);
    throw new Error('Failed to delete CM pack');
  }
}

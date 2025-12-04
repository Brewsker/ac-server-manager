import ini from 'ini';
import fs from 'fs/promises';
import path from 'path';

/**
 * Get entry list from entry_list.ini
 */
export async function getEntryList() {
  const entryListPath = process.env.AC_ENTRY_LIST_PATH;
  if (!entryListPath) {
    return { entries: [], error: 'AC_ENTRY_LIST_PATH not configured' };
  }

  try {
    const content = await fs.readFile(entryListPath, 'utf-8');
    const parsed = ini.parse(content);

    // Convert to array of entries
    const entries = [];
    for (let i = 0; i < 100; i++) {
      const key = `CAR_${i}`;
      if (parsed[key]) {
        entries.push({
          index: i,
          model: parsed[key].MODEL || '',
          skin: parsed[key].SKIN || 'default',
          driverName: parsed[key].DRIVERNAME || '',
          team: parsed[key].TEAM || '',
          guid: parsed[key].GUID || '',
          spectatorMode: parseInt(parsed[key].SPECTATOR_MODE) || 0,
          ballast: parseInt(parsed[key].BALLAST) || 0,
          restrictor: parseInt(parsed[key].RESTRICTOR) || 0,
        });
      }
    }

    return { entries };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { entries: [], error: 'Entry list file not found' };
    }
    throw error;
  }
}

/**
 * Save entry list to entry_list.ini
 */
export async function saveEntryList(entries) {
  const entryListPath = process.env.AC_ENTRY_LIST_PATH;
  if (!entryListPath) {
    throw new Error('AC_ENTRY_LIST_PATH not configured');
  }

  // Build INI structure
  const iniData = {};
  entries.forEach((entry, index) => {
    const key = `CAR_${index}`;
    iniData[key] = {
      MODEL: entry.model || '',
      SKIN: entry.skin || 'default',
      DRIVERNAME: entry.driverName || '',
      TEAM: entry.team || '',
      GUID: entry.guid || '',
      SPECTATOR_MODE: entry.spectatorMode || 0,
      BALLAST: entry.ballast || 0,
      RESTRICTOR: entry.restrictor || 0,
    };
  });

  // Write to file
  const iniString = ini.stringify(iniData);
  await fs.writeFile(entryListPath, iniString, 'utf-8');

  return { success: true, count: entries.length };
}

/**
 * Update a single entry in the list
 */
export async function updateEntry(index, entryData) {
  const { entries } = await getEntryList();

  if (index < 0 || index >= entries.length) {
    throw new Error('Entry index out of range');
  }

  entries[index] = { ...entries[index], ...entryData, index };
  await saveEntryList(entries);

  return entries[index];
}

/**
 * Add a new entry to the list
 */
export async function addEntry(entryData) {
  const { entries } = await getEntryList();

  const newEntry = {
    index: entries.length,
    model: entryData.model || '',
    skin: entryData.skin || 'default',
    driverName: entryData.driverName || '',
    team: entryData.team || '',
    guid: entryData.guid || '',
    spectatorMode: entryData.spectatorMode || 0,
    ballast: entryData.ballast || 0,
    restrictor: entryData.restrictor || 0,
  };

  entries.push(newEntry);
  await saveEntryList(entries);

  return newEntry;
}

/**
 * Delete an entry from the list
 */
export async function deleteEntry(index) {
  const { entries } = await getEntryList();

  if (index < 0 || index >= entries.length) {
    throw new Error('Entry index out of range');
  }

  entries.splice(index, 1);

  // Re-index remaining entries
  entries.forEach((entry, i) => {
    entry.index = i;
  });

  await saveEntryList(entries);

  return { success: true, remainingCount: entries.length };
}

/**
 * Convert entry list data to preset format
 */
export function entriesToPresetFormat(entries) {
  const result = {};
  entries.forEach((entry, index) => {
    result[`CAR_${index}`] = {
      MODEL: entry.model || '',
      SKIN: entry.skin || 'default',
      DRIVERNAME: entry.driverName || '',
      TEAM: entry.team || '',
      GUID: entry.guid || '',
      SPECTATOR_MODE: entry.spectatorMode || 0,
      BALLAST: entry.ballast || 0,
      RESTRICTOR: entry.restrictor || 0,
    };
  });
  return result;
}

/**
 * Convert preset format to entry list array
 */
export function presetFormatToEntries(presetData) {
  const entries = [];
  for (let i = 0; i < 100; i++) {
    const key = `CAR_${i}`;
    if (presetData[key]) {
      entries.push({
        index: i,
        model: presetData[key].MODEL || '',
        skin: presetData[key].SKIN || 'default',
        driverName: presetData[key].DRIVERNAME || '',
        team: presetData[key].TEAM || '',
        guid: presetData[key].GUID || '',
        spectatorMode: parseInt(presetData[key].SPECTATOR_MODE) || 0,
        ballast: parseInt(presetData[key].BALLAST) || 0,
        restrictor: parseInt(presetData[key].RESTRICTOR) || 0,
      });
    }
  }
  return entries;
}

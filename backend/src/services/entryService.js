import ini from 'ini';
import fs from 'fs/promises';

/**
 * Get all entries from entry_list.ini
 */
export async function getEntries() {
  const entryListPath = process.env.AC_ENTRY_LIST_PATH;
  if (!entryListPath) {
    throw new Error('AC_ENTRY_LIST_PATH not configured in .env');
  }

  try {
    const entryContent = await fs.readFile(entryListPath, 'utf-8');
    const entries = ini.parse(entryContent);
    
    // Convert to array format
    const entriesArray = Object.keys(entries)
      .filter(key => key.startsWith('CAR_'))
      .map(key => ({
        id: key,
        ...entries[key]
      }));

    return entriesArray;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Add new entry
 */
export async function addEntry(entryData) {
  const entries = await getEntries();
  
  // Find next available car number
  const carNumbers = entries.map(e => parseInt(e.id.replace('CAR_', '')));
  const nextNumber = carNumbers.length > 0 ? Math.max(...carNumbers) + 1 : 0;
  
  const newEntry = {
    id: `CAR_${nextNumber}`,
    ...entryData
  };

  // TODO: Write back to entry_list.ini

  return {
    success: true,
    entry: newEntry,
    message: 'Entry added (implementation pending)'
  };
}

/**
 * Update existing entry
 */
export async function updateEntry(entryId, entryData) {
  // TODO: Read current entries
  // TODO: Update specific entry
  // TODO: Write back to file

  return {
    success: true,
    message: 'Entry updated (implementation pending)'
  };
}

/**
 * Delete entry
 */
export async function deleteEntry(entryId) {
  // TODO: Read current entries
  // TODO: Remove specific entry
  // TODO: Write back to file

  return {
    success: true,
    message: 'Entry deleted (implementation pending)'
  };
}

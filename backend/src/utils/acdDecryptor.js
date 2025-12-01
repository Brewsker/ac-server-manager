import fs from 'fs/promises';
import path from 'path';
import lz4 from 'lz4js';

/**
 * ACD (Assetto Corsa Data) file parser
 *
 * ACD files are custom archive format with LZ4 compression:
 * Structure per file entry:
 * - 4 bytes: filename length (uint32 little-endian)
 * - N bytes: filename (ASCII)
 * - 4 bytes: COMPRESSED data size (uint32 little-endian)
 * - N bytes: LZ4 compressed file data
 */

/**
 * Parse ACD archive and extract all file entries
 */
function parseACD(buffer) {
  const entries = [];
  let offset = 0;
  let entryCount = 0;

  console.log(`[parseACD] Starting parse of ${buffer.length} byte buffer`);

  while (offset < buffer.length - 8) {
    entryCount++;

    // Read filename length
    const filenameLength = buffer.readUInt32LE(offset);
    console.log(
      `[parseACD] Entry ${entryCount} at offset ${offset}: filename length = ${filenameLength}`
    );
    offset += 4;

    // Sanity check
    if (filenameLength <= 0 || filenameLength > 1000 || offset + filenameLength > buffer.length) {
      console.log(`[parseACD] Sanity check failed, stopping parse`);
      break; // End of valid entries
    }

    // Read filename
    const filename = buffer.toString('ascii', offset, offset + filenameLength);
    console.log(`[parseACD] Filename: ${filename}`);
    offset += filenameLength;

    // Check if we have enough bytes for file size
    if (offset + 4 > buffer.length) {
      console.log(`[parseACD] Not enough bytes for file size, stopping`);
      break;
    }

    // Read file data size
    const fileSize = buffer.readUInt32LE(offset);
    console.log(`[parseACD] File size: ${fileSize} bytes`);
    offset += 4;

    // Check if we have enough bytes for file data
    if (offset + fileSize > buffer.length) {
      console.log(`[parseACD] Not enough bytes for file data, stopping`);
      break;
    }

    // Read file data
    const fileData = buffer.slice(offset, offset + fileSize);
    offset += fileSize;
    console.log(`[parseACD] Read ${fileSize} bytes, next offset will be ${offset}`);

    // ACD files store data as uint32 little-endian array where each uint32 holds one character
    // The low byte of each uint32 is XOR'd with a key
    let decodedData;
    try {
      const uint32Count = fileSize / 4;
      const chars = [];

      // Known plaintext attack: INI files start with '[' (0x5B)
      // Read first uint32 to derive XOR key
      const firstValue = fileData.readUInt32LE(0);
      const firstEncrypted = firstValue & 0xff;
      const expectedFirstChar = 0x5b; // '[' character
      const xorKey = firstEncrypted ^ expectedFirstChar;

      console.log(
        `[parseACD] First encrypted byte: 0x${firstEncrypted.toString(
          16
        )}, XOR key: 0x${xorKey.toString(16)}`
      );

      for (let i = 0; i < uint32Count; i++) {
        const value = fileData.readUInt32LE(i * 4);
        const encryptedByte = value & 0xff;
        const decryptedByte = encryptedByte ^ xorKey;
        chars.push(decryptedByte);
      }

      decodedData = Buffer.from(chars);
      console.log(`[parseACD] Decoded ${chars.length} characters`);
      console.log(`[parseACD] First 200 chars: ${decodedData.toString('utf-8').substring(0, 200)}`);
    } catch (error) {
      console.log(`[parseACD] Decoding failed for ${filename}: ${error.message}`);
      decodedData = fileData; // Fall back to raw data
    }

    entries.push({
      filename: filename.replace(/\\/g, '/'),
      size: decodedData.length,
      data: decodedData,
    });
  }

  console.log(
    `[parseACD] Parse complete: found ${entries.length} entries, stopped at offset ${offset}/${buffer.length}`
  );
  return entries;
}

/**
 * Extract a specific file from ACD archive
 */
export async function extractFileFromACD(acdPath, targetFilename) {
  try {
    console.log(`[acdDecryptor] Reading ${acdPath}`);
    const acdData = await fs.readFile(acdPath);
    console.log(`[acdDecryptor] File size: ${acdData.length} bytes`);

    // Parse ACD archive
    const entries = parseACD(acdData);
    console.log(
      `[acdDecryptor] Found ${entries.length} files:`,
      entries.map((e) => e.filename)
    );

    // Find target file
    const normalizedTarget = targetFilename.toLowerCase().replace(/\\/g, '/');
    const entry = entries.find(
      (e) =>
        e.filename.toLowerCase() === normalizedTarget ||
        e.filename.toLowerCase().endsWith('/' + normalizedTarget) ||
        e.filename.toLowerCase().endsWith(normalizedTarget)
    );

    if (!entry) {
      console.log(`[acdDecryptor] Target file "${targetFilename}" not found`);
      return null;
    }

    console.log(`[acdDecryptor] Found ${entry.filename}, size=${entry.size} bytes`);

    // Return file content as UTF-8 string
    const content = entry.data.toString('utf-8');
    console.log(
      `[acdDecryptor] Extract result for ${targetFilename}: SUCCESS (${content.length} chars)`
    );
    return content;
  } catch (error) {
    console.error(
      `[acdDecryptor] Failed to extract ${targetFilename} from ${acdPath}:`,
      error.message
    );
    console.error(error.stack);
    return null;
  }
}

/**
 * Extract tyres.ini from a car's data.acd file
 */
export async function extractTyresIni(carPath) {
  const acdPath = path.join(carPath, 'data.acd');

  try {
    // Check if data.acd exists
    await fs.access(acdPath);
  } catch {
    // No data.acd file
    return null;
  }

  return await extractFileFromACD(acdPath, 'tyres.ini');
}

/**
 * Check if a car uses encrypted data (has data.acd but no data/ folder)
 */
export async function hasEncryptedData(carPath) {
  try {
    const [hasAcd, hasDataFolder] = await Promise.all([
      fs
        .access(path.join(carPath, 'data.acd'))
        .then(() => true)
        .catch(() => false),
      fs
        .access(path.join(carPath, 'data'))
        .then(() => true)
        .catch(() => false),
    ]);

    return hasAcd && !hasDataFolder;
  } catch {
    return false;
  }
}

export default {
  extractFileFromACD,
  extractTyresIni,
  hasEncryptedData,
};

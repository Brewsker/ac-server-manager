import fs from 'fs/promises';
import path from 'path';
import * as acdDecryptor from '../utils/acdDecryptor.js';

// In-memory cache
const cache = {
  tracks: null,
  cars: null,
  tracksTimestamp: null,
  carsTimestamp: null,
};

/**
 * Clear the content cache
 */
export function clearCache() {
  cache.tracks = null;
  cache.cars = null;
  cache.tracksTimestamp = null;
  cache.carsTimestamp = null;
  console.log('[contentService] Cache cleared');
}

/**
 * Scan and return available tracks
 */
export async function getTracks() {
  // Return cached data if available
  if (cache.tracks) {
    console.log('[getTracks] Returning cached tracks');
    return cache.tracks;
  }

  console.log('[getTracks] Cache miss, scanning filesystem');
  const acContentPath = process.env.AC_CONTENT_PATH;
  if (!acContentPath) {
    throw new Error('AC_CONTENT_PATH not configured in .env');
  }

  const tracksPath = path.join(acContentPath, 'tracks');

  // Fallback metadata for known Kunos tracks without ui_track.json
  const kunosTrackMetadata = {
    ks_barcelona: { name: 'Circuit de Barcelona-Catalunya', country: 'Spain', city: 'Barcelona' },
    ks_black_cat_county: { name: 'Black Cat County', country: 'USA', city: null },
    ks_brands_hatch: { name: 'Brands Hatch', country: 'Great Britain', city: 'Kent' },
    ks_drag: { name: 'Drag Strip', country: 'USA', city: null },
    ks_highlands: { name: 'Highlands Motorsport Park', country: 'New Zealand', city: 'Cromwell' },
    ks_monza66: { name: 'Monza 1966', country: 'Italy', city: 'Monza' },
    ks_nordschleife: { name: 'Nordschleife', country: 'Germany', city: 'Nürburg' },
    ks_nurburgring: { name: 'Nürburgring', country: 'Germany', city: 'Nürburg' },
    ks_red_bull_ring: { name: 'Red Bull Ring', country: 'Austria', city: 'Spielberg' },
    ks_silverstone: { name: 'Silverstone Circuit', country: 'Great Britain', city: 'Silverstone' },
    ks_vallelunga: {
      name: 'Autodromo Vallelunga Piero Taruffi',
      country: 'Italy',
      city: 'Vallelunga',
    },
    imola: { name: 'Autodromo Enzo e Dino Ferrari', country: 'Italy', city: 'Imola' },
    magione: { name: "Autodromo dell'Umbria", country: 'Italy', city: 'Magione' },
    monza: { name: 'Autodromo Nazionale di Monza', country: 'Italy', city: 'Monza' },
    mugello: { name: 'Mugello Circuit', country: 'Italy', city: 'Mugello' },
    'trento-bondone': { name: 'Trento-Bondone', country: 'Italy', city: 'Trento' },
  };

  try {
    const trackFolders = await fs.readdir(tracksPath);
    const tracks = [];

    for (const folder of trackFolders) {
      const trackPath = path.join(tracksPath, folder);
      const stat = await fs.stat(trackPath);

      if (stat.isDirectory()) {
        // Start with default metadata
        let metadata = {
          id: folder,
          name: folder.replace(/_/g, ' '),
          path: trackPath,
          country: null,
          city: null,
          length: null,
          width: null,
          pitboxes: null,
          run: null,
          description: null,
          tags: [],
          geotags: [],
          author: null,
          version: null,
          url: null,
        };

        // Apply fallback metadata for known Kunos tracks
        if (kunosTrackMetadata[folder]) {
          metadata = {
            ...metadata,
            ...kunosTrackMetadata[folder],
          };
        }

        // Try to read ui_track.json for track metadata
        const uiTrackPath = path.join(trackPath, 'ui', 'ui_track.json');
        try {
          const uiTrackData = await fs.readFile(uiTrackPath, 'utf-8');
          const trackInfo = JSON.parse(uiTrackData);

          // Override with actual metadata if available
          metadata = {
            ...metadata,
            name: trackInfo.name || metadata.name,
            country: trackInfo.country || metadata.country,
            city: trackInfo.city || metadata.city,
            length: trackInfo.length || metadata.length,
            width: trackInfo.width || metadata.width,
            pitboxes: trackInfo.pitboxes || metadata.pitboxes,
            run: trackInfo.run || metadata.run,
            description: trackInfo.description || metadata.description,
            tags: trackInfo.tags || metadata.tags,
            geotags: trackInfo.geotags || metadata.geotags,
            author: trackInfo.author || metadata.author,
            version: trackInfo.version || metadata.version,
            url: trackInfo.url || metadata.url,
          };
        } catch (error) {
          // If ui_track.json doesn't exist or is invalid, use fallback/defaults
          console.log(`[getTracks] No metadata for ${folder}, using fallback`);
        }

        tracks.push(metadata);
      }
    }

    // Cache the results
    cache.tracks = tracks;
    cache.tracksTimestamp = new Date().toISOString();
    console.log(`[getTracks] Cached ${tracks.length} tracks`);

    return tracks;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Tracks folder not found. Check AC_CONTENT_PATH');
    }
    throw error;
  }
}

/**
 * Scan and return available cars
 */
export async function getCars() {
  // Return cached data if available
  if (cache.cars) {
    console.log('[getCars] Returning cached cars');
    return cache.cars;
  }

  console.log('[getCars] Cache miss, scanning filesystem');
  console.log('[getCars] Starting...');
  const acContentPath = process.env.AC_CONTENT_PATH;
  console.log('[getCars] AC_CONTENT_PATH:', acContentPath);

  if (!acContentPath) {
    throw new Error('AC_CONTENT_PATH not configured in .env');
  }

  const carsPath = path.join(acContentPath, 'cars');
  console.log('[getCars] Cars path:', carsPath);

  try {
    const carFolders = await fs.readdir(carsPath);
    console.log('[getCars] Found', carFolders.length, 'items');
    const cars = [];

    for (const folder of carFolders) {
      const carPath = path.join(carsPath, folder);
      const stat = await fs.stat(carPath);

      if (stat.isDirectory()) {
        // TODO: Read ui/ui_car.json for car metadata
        cars.push({
          id: folder,
          name: folder.replace(/_/g, ' '),
          path: carPath,
        });
      }
    }

    // Cache the results
    cache.cars = cars;
    cache.carsTimestamp = new Date().toISOString();
    console.log('[getCars] Returning', cars.length, 'cars');
    return cars;
  } catch (error) {
    console.error('[getCars] Error:', error);
    if (error.code === 'ENOENT') {
      throw new Error('Cars folder not found. Check AC_CONTENT_PATH');
    }
    throw error;
  }
}

/**
 * Common AC tire types database (fallback when data folders aren't unpacked)
 */
const COMMON_TIRE_TYPES = {
  // Street tires
  ST: { code: 'ST', name: 'Street', category: 'Street' },
  SV: { code: 'SV', name: 'Street 90s', category: 'Street' },

  // Semi-slick
  SM: { code: 'SM', name: 'Semislick', category: 'Semi-Slick' },

  // Slick tires
  H: { code: 'H', name: 'Hard', category: 'Slick' },
  M: { code: 'M', name: 'Medium', category: 'Slick' },
  S: { code: 'S', name: 'Soft', category: 'Slick' },
  SS: { code: 'SS', name: 'Super Soft', category: 'Slick' },

  // Vintage
  '70sH': { code: '70sH', name: 'Hard GP70', category: 'Vintage' },
  '70sM': { code: '70sM', name: 'Medium GP70', category: 'Vintage' },
  '70sS': { code: '70sS', name: 'Soft GP70', category: 'Vintage' },

  // Modern F1
  F1_H: { code: 'F1_H', name: 'F1 Hard', category: 'F1' },
  F1_M: { code: 'F1_M', name: 'F1 Medium', category: 'F1' },
  F1_S: { code: 'F1_S', name: 'F1 Soft', category: 'F1' },
  F1_SS: { code: 'F1_SS', name: 'F1 Super Soft', category: 'F1' },

  // GT3/Racing
  DHD2: { code: 'DHD2', name: 'Hard', category: 'GT3' },
  DHM2: { code: 'DHM2', name: 'Medium', category: 'GT3' },
  DHS2: { code: 'DHS2', name: 'Soft', category: 'GT3' },
};

/**
 * Get weather presets
 */
export async function getWeatherPresets() {
  // Default AC weather types
  return [
    { id: '1_light_clouds', name: 'Light Clouds' },
    { id: '2_mid_clear', name: 'Mid Clear' },
    { id: '3_clear', name: 'Clear' },
    { id: '4_mid_clouds', name: 'Mid Clouds' },
    { id: '5_heavy_clouds', name: 'Heavy Clouds' },
    { id: '6_storm', name: 'Storm' },
  ];
}

/**
 * Extract tire codes from tyres.ini content
 */
function parseTyresIni(content) {
  const tires = [];
  const lines = content.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for section headers like [FRONT] or [REAR]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }

    // Look for SHORT_NAME in tire sections
    if (trimmed.startsWith('SHORT_NAME=')) {
      const shortName = trimmed.split('=')[1].trim();
      if (shortName && !tires.includes(shortName)) {
        tires.push(shortName);
      }
    }

    // Also check NAME field as fallback
    if (trimmed.startsWith('NAME=') && !trimmed.startsWith('SHORT_NAME=')) {
      const name = trimmed.split('=')[1].trim();
      if (name && !tires.includes(name)) {
        tires.push(name);
      }
    }
  }

  return tires;
}

/**
 * Get all available tire types from all cars
 */
export async function getAllTires() {
  console.log('[getAllTires] Starting tire scan...');
  const acContentPath = process.env.AC_CONTENT_PATH;

  if (!acContentPath) {
    throw new Error('AC_CONTENT_PATH not configured in .env');
  }

  const carsPath = path.join(acContentPath, 'cars');
  const allTires = new Map(); // Map<tireCode, { code, name, cars: Set<carId> }>

  try {
    const carFolders = await fs.readdir(carsPath);
    console.log(`[getAllTires] Scanning ${carFolders.length} cars...`);

    for (const carId of carFolders) {
      const carPath = path.join(carsPath, carId);
      const stat = await fs.stat(carPath);

      if (!stat.isDirectory()) continue;

      const tyresIniPath = path.join(carPath, 'data', 'tyres.ini');
      let tyresContent = null;

      // Try to read from unpacked data folder first
      try {
        tyresContent = await fs.readFile(tyresIniPath, 'utf-8');
      } catch (error) {
        // Unpacked data not found, try to decrypt from data.acd
        tyresContent = await acdDecryptor.extractTyresIni(carPath);
      }

      if (tyresContent) {
        const tireCodes = parseTyresIni(tyresContent);

        for (const code of tireCodes) {
          if (!allTires.has(code)) {
            allTires.set(code, {
              code: code,
              name: code,
              cars: new Set([carId]),
            });
          } else {
            allTires.get(code).cars.add(carId);
          }
        }
      }
    }

    // Convert to array format
    const tires = Array.from(allTires.values()).map((tire) => ({
      code: tire.code,
      name: tire.name,
      cars: Array.from(tire.cars),
      carCount: tire.cars.size,
    }));

    console.log(`[getAllTires] Found ${tires.length} unique tire types`);
    return tires;
  } catch (error) {
    console.error('[getAllTires] Error:', error);
    throw error;
  }
}

/**
 * Get tire types for specific cars
 */
export async function getTiresForCars(carIds) {
  console.log('[getTiresForCars] Getting tires for:', carIds);

  if (!carIds || carIds.length === 0) {
    return [];
  }

  const acContentPath = process.env.AC_CONTENT_PATH;

  if (!acContentPath) {
    throw new Error('AC_CONTENT_PATH not configured in .env');
  }

  const carsPath = path.join(acContentPath, 'cars');
  const tireMap = new Map(); // Map<tireCode, { code, name, cars: Set<carId> }>
  let foundAnyData = false;

  for (const carId of carIds) {
    const carPath = path.join(carsPath, carId);
    const tyresIniPath = path.join(carPath, 'data', 'tyres.ini');
    let tyresContent = null;

    // Try to read from unpacked data folder first
    try {
      tyresContent = await fs.readFile(tyresIniPath, 'utf-8');
      console.log(`[getTiresForCars] Read tyres.ini from unpacked data for ${carId}`);
    } catch (error) {
      // Unpacked data not found, try to decrypt from data.acd
      console.log(`[getTiresForCars] Attempting to decrypt data.acd for ${carId}`);
      tyresContent = await acdDecryptor.extractTyresIni(carPath);

      if (tyresContent) {
        console.log(`[getTiresForCars] Successfully decrypted tyres.ini for ${carId}`);
      } else {
        console.log(`[getTiresForCars] Could not extract tires for ${carId} (no data found)`);
        continue;
      }
    }

    // Parse tire codes from the content
    if (tyresContent) {
      const tireCodes = parseTyresIni(tyresContent);
      foundAnyData = true;

      for (const code of tireCodes) {
        if (!tireMap.has(code)) {
          const tireInfo = COMMON_TIRE_TYPES[code] || { code, name: code };
          tireMap.set(code, {
            code: tireInfo.code,
            name: tireInfo.name,
            category: tireInfo.category,
            cars: new Set([carId]),
          });
        } else {
          tireMap.get(code).cars.add(carId);
        }
      }
    }
  }

  // If no data found for any car, return empty array
  if (!foundAnyData) {
    console.log('[getTiresForCars] No tire data found for any selected cars');
    return [];
  }

  const tires = Array.from(tireMap.values()).map((tire) => ({
    code: tire.code,
    name: tire.name,
    category: tire.category,
    cars: Array.from(tire.cars),
    carCount: tire.cars.size,
  }));

  console.log(`[getTiresForCars] Found ${tires.length} tire types for ${carIds.length} cars`);
  return tires;
}

/**
 * Scan AC content folder for all content
 */
export async function scanContent() {
  const [tracks, cars, weather] = await Promise.all([getTracks(), getCars(), getWeatherPresets()]);

  return {
    tracks: tracks.length,
    cars: cars.length,
    weather: weather.length,
    timestamp: new Date().toISOString(),
  };
}

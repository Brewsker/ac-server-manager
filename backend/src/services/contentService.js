import fs from 'fs/promises';
import path from 'path';

// In-memory cache
const cache = {
  tracks: null,
  cars: null,
  tracksTimestamp: null,
  carsTimestamp: null
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
    'ks_barcelona': { name: 'Circuit de Barcelona-Catalunya', country: 'Spain', city: 'Barcelona' },
    'ks_black_cat_county': { name: 'Black Cat County', country: 'USA', city: null },
    'ks_brands_hatch': { name: 'Brands Hatch', country: 'Great Britain', city: 'Kent' },
    'ks_drag': { name: 'Drag Strip', country: 'USA', city: null },
    'ks_highlands': { name: 'Highlands Motorsport Park', country: 'New Zealand', city: 'Cromwell' },
    'ks_monza66': { name: 'Monza 1966', country: 'Italy', city: 'Monza' },
    'ks_nordschleife': { name: 'Nordschleife', country: 'Germany', city: 'Nürburg' },
    'ks_nurburgring': { name: 'Nürburgring', country: 'Germany', city: 'Nürburg' },
    'ks_red_bull_ring': { name: 'Red Bull Ring', country: 'Austria', city: 'Spielberg' },
    'ks_silverstone': { name: 'Silverstone Circuit', country: 'Great Britain', city: 'Silverstone' },
    'ks_vallelunga': { name: 'Autodromo Vallelunga Piero Taruffi', country: 'Italy', city: 'Vallelunga' },
    'imola': { name: 'Autodromo Enzo e Dino Ferrari', country: 'Italy', city: 'Imola' },
    'magione': { name: 'Autodromo dell\'Umbria', country: 'Italy', city: 'Magione' },
    'monza': { name: 'Autodromo Nazionale di Monza', country: 'Italy', city: 'Monza' },
    'mugello': { name: 'Mugello Circuit', country: 'Italy', city: 'Mugello' },
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
          url: null
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
            url: trackInfo.url || metadata.url
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
          path: carPath
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
    { id: '6_storm', name: 'Storm' }
  ];
}

/**
 * Scan AC content folder for all content
 */
export async function scanContent() {
  const [tracks, cars, weather] = await Promise.all([
    getTracks(),
    getCars(),
    getWeatherPresets()
  ]);

  return {
    tracks: tracks.length,
    cars: cars.length,
    weather: weather.length,
    timestamp: new Date().toISOString()
  };
}

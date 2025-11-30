import express from 'express';
import path from 'path';
import fs from 'fs';
import * as contentService from '../services/contentService.js';

const router = express.Router();

// Get available tracks
router.get('/tracks', async (req, res, next) => {
  try {
    const tracks = await contentService.getTracks();
    res.json(tracks);
  } catch (error) {
    next(error);
  }
});

// Get available cars
router.get('/cars', async (req, res, next) => {
  try {
    const cars = await contentService.getCars();
    res.json(cars);
  } catch (error) {
    next(error);
  }
});

// Get weather presets
router.get('/weather', async (req, res, next) => {
  try {
    const weather = await contentService.getWeatherPresets();
    res.json(weather);
  } catch (error) {
    next(error);
  }
});

// Scan AC content folder
router.post('/scan', async (req, res, next) => {
  try {
    const result = await contentService.scanContent();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Serve track preview image
router.get('/track-preview/:trackId', (req, res) => {
  const acContentPath = process.env.AC_CONTENT_PATH;
  if (!acContentPath) {
    return res.status(500).send('AC_CONTENT_PATH not configured');
  }

  const { trackId } = req.params;
  const trackPath = path.join(acContentPath, 'tracks', trackId);

  // List of possible preview locations in order of preference
  const previewPaths = [
    // Main track UI folder
    path.join(trackPath, 'ui', 'preview.png'),
    path.join(trackPath, 'ui', 'outline.png'),
    
    // Check for track configurations (layouts)
    path.join(trackPath, 'ui', 'ui_track.json'), // We'll parse this to find config folders
  ];

  // Try direct preview paths first
  for (const previewPath of previewPaths.slice(0, 2)) {
    if (fs.existsSync(previewPath)) {
      return res.sendFile(previewPath);
    }
  }

  // If no direct preview found, check for track configurations
  try {
    const uiPath = path.join(trackPath, 'ui');
    if (fs.existsSync(uiPath)) {
      const uiContents = fs.readdirSync(uiPath);
      
      // Look for configuration folders (e.g., "ui/sprint", "ui/gp", etc.)
      for (const item of uiContents) {
        const itemPath = path.join(uiPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          const configPreview = path.join(itemPath, 'preview.png');
          const configOutline = path.join(itemPath, 'outline.png');
          
          if (fs.existsSync(configPreview)) {
            return res.sendFile(configPreview);
          }
          if (fs.existsSync(configOutline)) {
            return res.sendFile(configOutline);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading track configurations:', error);
  }

  res.status(404).send('Preview not found');
});

// Serve car preview image
router.get('/car-preview/:carId', (req, res) => {
  const acContentPath = process.env.AC_CONTENT_PATH;
  if (!acContentPath) {
    return res.status(500).send('AC_CONTENT_PATH not configured');
  }

  const { carId } = req.params;
  // AC stores car previews in skins folder, we'll use the first skin's preview
  const carPath = path.join(acContentPath, 'cars', carId);
  const skinsPath = path.join(carPath, 'skins');

  try {
    if (fs.existsSync(skinsPath)) {
      const skins = fs.readdirSync(skinsPath);
      if (skins.length > 0) {
        const previewPath = path.join(skinsPath, skins[0], 'preview.jpg');
        if (fs.existsSync(previewPath)) {
          return res.sendFile(previewPath);
        }
      }
    }
    
    // Try ui/badge.png as fallback
    const badgePath = path.join(carPath, 'ui', 'badge.png');
    if (fs.existsSync(badgePath)) {
      return res.sendFile(badgePath);
    }

    res.status(404).send('Preview not found');
  } catch (error) {
    res.status(500).send('Error reading car preview');
  }
});

// Serve country flag image
router.get('/country-flag/:countryCode', (req, res) => {
  const acContentPath = process.env.AC_CONTENT_PATH;
  if (!acContentPath) {
    return res.status(500).send('AC_CONTENT_PATH not configured');
  }

  const { countryCode } = req.params;
  
  // Country name to ISO 3166-1 alpha-3 code mapping (common AC countries)
  const countryToISO = {
    'italy': 'ITA',
    'germany': 'DEU',
    'united kingdom': 'GBR',
    'great britain': 'GBR',
    'uk': 'GBR',
    'england': 'GBR',
    'scotland': 'SCO',
    'wales': 'WAL',
    'france': 'FRA',
    'spain': 'ESP',
    'usa': 'USA',
    'united states': 'USA',
    'japan': 'JPN',
    'belgium': 'BEL',
    'austria': 'AUT',
    'netherlands': 'NLD',
    'holland': 'NLD',
    'monaco': 'MCO',
    'portugal': 'PRT',
    'australia': 'AUS',
    'brazil': 'BRA',
    'canada': 'CAN',
    'mexico': 'MEX',
    'sweden': 'SWE',
    'finland': 'FIN',
    'norway': 'NOR',
    'denmark': 'DNK',
    'switzerland': 'CHE',
    'hungary': 'HUN',
    'czech republic': 'CZE',
    'poland': 'POL',
    'russia': 'RUS',
    'china': 'CHN',
    'singapore': 'SGP',
    'south korea': 'KOR',
    'korea': 'KOR',
    'india': 'IND',
    'new zealand': 'NZL',
    'south africa': 'ZAF',
    'argentina': 'ARG',
    'turkey': 'TUR',
    'greece': 'GRC',
    'ireland': 'IRL',
  };

  const normalizedCode = countryCode.toLowerCase().replace(/_/g, ' ');
  const isoCode = countryToISO[normalizedCode] || countryCode.toUpperCase();
  
  // AC stores nation flags in content/gui/NationFlags/
  const flagPath = path.join(acContentPath, 'gui', 'NationFlags', `${isoCode}.png`);

  if (fs.existsSync(flagPath)) {
    return res.sendFile(flagPath);
  }

  res.status(404).send('Flag not found');
});

export default router;

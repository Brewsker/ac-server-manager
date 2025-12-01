import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentUploadService {
  constructor() {
    // Configure multer for temporary storage
    this.upload = multer({
      dest: path.join(__dirname, '../../temp/uploads'),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
      },
      fileFilter: (req, file, cb) => {
        // Accept only zip files
        if (
          file.mimetype === 'application/zip' ||
          file.mimetype === 'application/x-zip-compressed' ||
          file.originalname.endsWith('.zip')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only .zip files are allowed'));
        }
      },
    });
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    const tempDir = path.join(__dirname, '../../temp/uploads');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore if already exists
    }
  }

  /**
   * Validate track folder structure
   */
  async validateTrackFolder(extractPath) {
    // Track must have data folder with surfaces.ini
    const dataPath = path.join(extractPath, 'data');
    const surfacesPath = path.join(dataPath, 'surfaces.ini');

    try {
      await fs.access(dataPath);
      await fs.access(surfacesPath);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid track structure. Must contain data/surfaces.ini',
      };
    }
  }

  /**
   * Validate car folder structure
   */
  async validateCarFolder(extractPath) {
    // Car must have data folder and data.acd or unpacked data
    const dataPath = path.join(extractPath, 'data');
    const dataAcdPath = path.join(dataPath, 'data.acd');

    try {
      await fs.access(dataPath);

      // Check for either data.acd or unpacked files
      try {
        await fs.access(dataAcdPath);
        return { valid: true };
      } catch {
        // Check for unpacked data files
        const files = await fs.readdir(dataPath);
        if (files.some((f) => f.endsWith('.ini'))) {
          return { valid: true };
        }
      }

      return {
        valid: false,
        error: 'Invalid car structure. Must contain data folder with data.acd or .ini files',
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid car structure. Must contain data folder',
      };
    }
  }

  /**
   * Upload and install a track
   */
  async uploadTrack(file) {
    console.log('[ContentUpload] Uploading track:', file.originalname);

    const acContentPath = process.env.AC_CONTENT_PATH;
    if (!acContentPath) {
      throw new Error('AC_CONTENT_PATH not configured');
    }

    const tracksPath = path.join(acContentPath, 'tracks');

    // Ensure temp directory exists
    await this.ensureTempDir();

    // Create temporary extraction directory
    const tempExtractPath = path.join(__dirname, '../../temp/extract', Date.now().toString());
    await fs.mkdir(tempExtractPath, { recursive: true });

    try {
      // Extract zip file
      console.log('[ContentUpload] Extracting zip file...');
      const zip = new AdmZip(file.path);
      zip.extractAllTo(tempExtractPath, true);

      // Find the track folder (might be nested)
      const extractedItems = await fs.readdir(tempExtractPath);
      let trackFolderPath = tempExtractPath;
      let trackFolderId = null;

      // If there's only one folder, it might be the track folder
      if (extractedItems.length === 1) {
        const itemPath = path.join(tempExtractPath, extractedItems[0]);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          trackFolderPath = itemPath;
          trackFolderId = extractedItems[0];
        }
      } else {
        // Multiple items, use the temp path as track folder
        // User needs to provide the track ID
        trackFolderId = path
          .parse(file.originalname)
          .name.toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      }

      // Validate track structure
      const validation = await this.validateTrackFolder(trackFolderPath);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Determine final track ID
      if (!trackFolderId) {
        trackFolderId = path
          .parse(file.originalname)
          .name.toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      }

      // Check if track already exists
      const finalTrackPath = path.join(tracksPath, trackFolderId);
      const trackExists = await fs
        .access(finalTrackPath)
        .then(() => true)
        .catch(() => false);

      if (trackExists) {
        throw new Error(
          `Track '${trackFolderId}' already exists. Delete it first or rename the upload.`
        );
      }

      // Copy track to AC content folder
      console.log('[ContentUpload] Installing track to:', finalTrackPath);
      await this.copyDirectory(trackFolderPath, finalTrackPath);

      // Read track metadata if available
      let trackName = trackFolderId;
      try {
        const uiTrackPath = path.join(finalTrackPath, 'ui', 'ui_track.json');
        const trackData = await fs.readFile(uiTrackPath, 'utf-8');
        const trackInfo = JSON.parse(trackData);
        trackName = trackInfo.name || trackFolderId;
      } catch {
        // Metadata not available
      }

      console.log('[ContentUpload] Track installed successfully:', trackFolderId);

      return {
        success: true,
        id: trackFolderId,
        name: trackName,
        path: finalTrackPath,
      };
    } finally {
      // Cleanup
      try {
        await fs.rm(file.path);
        await fs.rm(tempExtractPath, { recursive: true, force: true });
      } catch (error) {
        console.error('[ContentUpload] Cleanup error:', error);
      }
    }
  }

  /**
   * Upload and install a car
   */
  async uploadCar(file) {
    console.log('[ContentUpload] Uploading car:', file.originalname);

    const acContentPath = process.env.AC_CONTENT_PATH;
    if (!acContentPath) {
      throw new Error('AC_CONTENT_PATH not configured');
    }

    const carsPath = path.join(acContentPath, 'cars');

    // Ensure temp directory exists
    await this.ensureTempDir();

    // Create temporary extraction directory
    const tempExtractPath = path.join(__dirname, '../../temp/extract', Date.now().toString());
    await fs.mkdir(tempExtractPath, { recursive: true });

    try {
      // Extract zip file
      console.log('[ContentUpload] Extracting zip file...');
      const zip = new AdmZip(file.path);
      zip.extractAllTo(tempExtractPath, true);

      // Find the car folder (might be nested)
      const extractedItems = await fs.readdir(tempExtractPath);
      let carFolderPath = tempExtractPath;
      let carFolderId = null;

      // If there's only one folder, it might be the car folder
      if (extractedItems.length === 1) {
        const itemPath = path.join(tempExtractPath, extractedItems[0]);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          carFolderPath = itemPath;
          carFolderId = extractedItems[0];
        }
      } else {
        // Multiple items, use the temp path as car folder
        carFolderId = path
          .parse(file.originalname)
          .name.toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      }

      // Validate car structure
      const validation = await this.validateCarFolder(carFolderPath);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Determine final car ID
      if (!carFolderId) {
        carFolderId = path
          .parse(file.originalname)
          .name.toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      }

      // Check if car already exists
      const finalCarPath = path.join(carsPath, carFolderId);
      const carExists = await fs
        .access(finalCarPath)
        .then(() => true)
        .catch(() => false);

      if (carExists) {
        throw new Error(
          `Car '${carFolderId}' already exists. Delete it first or rename the upload.`
        );
      }

      // Copy car to AC content folder
      console.log('[ContentUpload] Installing car to:', finalCarPath);
      await this.copyDirectory(carFolderPath, finalCarPath);

      // Read car metadata if available
      let carName = carFolderId;
      try {
        const uiCarPath = path.join(finalCarPath, 'ui', 'ui_car.json');
        const carData = await fs.readFile(uiCarPath, 'utf-8');
        const carInfo = JSON.parse(carData);
        carName = carInfo.name || carFolderId;
      } catch {
        // Metadata not available
      }

      console.log('[ContentUpload] Car installed successfully:', carFolderId);

      return {
        success: true,
        id: carFolderId,
        name: carName,
        path: finalCarPath,
      };
    } finally {
      // Cleanup
      try {
        await fs.rm(file.path);
        await fs.rm(tempExtractPath, { recursive: true, force: true });
      } catch (error) {
        console.error('[ContentUpload] Cleanup error:', error);
      }
    }
  }

  /**
   * Recursively copy directory
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Get upload middleware for Express
   */
  getUploadMiddleware() {
    return this.upload.single('file');
  }
}

export default new ContentUploadService();

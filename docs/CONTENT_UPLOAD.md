# Content Upload System

## Overview

The AC Server Manager now includes a simple file upload system that allows administrators to add new tracks and cars to the server without needing physical access to the server machine.

## Features

- ✅ Upload tracks via ZIP files
- ✅ Upload cars via ZIP files
- ✅ Automatic validation of content structure
- ✅ Automatic extraction and installation
- ✅ File size limit: 500MB per upload
- ✅ Automatic cache refresh after upload
- ✅ Success/error feedback

## Usage

### Via Web UI (Settings Page)

1. Navigate to **Settings** in the sidebar
2. Scroll to **Content Management** section
3. Click "Choose File" for either Track or Car upload
4. Select a ZIP file from your local machine
5. Upload automatically starts
6. Success/error message appears
7. New content is immediately available in Config Editor

### File Requirements

**Track ZIP Structure:**

```
track_name.zip
└── track_folder_name/
    ├── data/
    │   ├── surfaces.ini (required)
    │   ├── drs_zones.ini
    │   └── ...
    ├── models/
    ├── ui/
    │   └── ui_track.json
    └── ...
```

**Car ZIP Structure:**

```
car_name.zip
└── car_folder_name/
    ├── data/
    │   ├── data.acd (required) OR
    │   ├── *.ini files (unpacked data)
    │   └── ...
    ├── sfx/
    ├── skins/
    ├── ui/
    │   └── ui_car.json
    └── ...
```

## API Endpoints

### Upload Track

```http
POST /api/content/upload/track
Content-Type: multipart/form-data

file: <track.zip>
```

**Response:**

```json
{
  "success": true,
  "id": "imola",
  "name": "Autodromo Enzo e Dino Ferrari",
  "path": "G:/AC/content/tracks/imola"
}
```

### Upload Car

```http
POST /api/content/upload/car
Content-Type: multipart/form-data

file: <car.zip>
```

**Response:**

```json
{
  "success": true,
  "id": "ferrari_458",
  "name": "Ferrari 458 Italia",
  "path": "G:/AC/content/cars/ferrari_458"
}
```

## Validation Rules

**Tracks:**

- Must contain `data/surfaces.ini` file
- Folder structure must match AC track format
- Will be installed to `AC_CONTENT_PATH/tracks/`

**Cars:**

- Must contain `data/` folder
- Must have either `data/data.acd` OR unpacked `.ini` files
- Folder structure must match AC car format
- Will be installed to `AC_CONTENT_PATH/cars/`

## Error Handling

**Common Errors:**

- **"Only .zip files are allowed"** - Wrong file format
- **"Invalid track structure"** - Missing required files (e.g., surfaces.ini)
- **"Invalid car structure"** - Missing data folder or files
- **"Track already exists"** - Duplicate installation (delete existing first)
- **"AC_CONTENT_PATH not configured"** - Server misconfigured

## Limitations

- Max file size: 500MB per upload
- Only ZIP archives supported
- Duplicate content names not allowed
- No automatic update/overwrite (must delete first)
- No batch upload (one file at a time)

## Security Considerations

**Current Implementation:**

- File type validation (ZIP only)
- File size limits (500MB)
- Structure validation before installation
- No executable file execution

**Recommendations for Production:**

- Add authentication/authorization
- Implement user role checks (admin only)
- Add virus scanning for uploaded files
- Rate limiting on uploads
- Disk space checks before upload
- Content approval workflow

## Deployment Notes

**Proxmox Server Setup:**

When running on Proxmox/remote server:

1. Ensure `AC_CONTENT_PATH` is set correctly
2. Uploads go to temporary directory first (`backend/temp/uploads`)
3. Extracted to `backend/temp/extract`
4. Copied to AC content folder
5. Temporary files auto-deleted

**Disk Space Requirements:**

- Temporary storage: 2x upload size (zip + extracted)
- Final content: Track (10-500MB), Car (10-100MB)
- Recommend 10GB+ free space for temp directory

## Future Enhancements

- [ ] Batch upload (multiple files)
- [ ] Content preview before installation
- [ ] Update existing content (versioning)
- [ ] Content marketplace integration
- [ ] Automatic mod dependency resolution
- [ ] Content backup before update
- [ ] S3/cloud storage integration
- [ ] Download from URL instead of upload

## Troubleshooting

**Upload fails immediately:**

- Check file is .zip format
- Check file size < 500MB
- Check browser console for errors

**Upload succeeds but content not appearing:**

- Check AC_CONTENT_PATH is correct
- Check disk permissions
- Manually verify files in content folder
- Clear browser cache and refresh

**"Invalid structure" errors:**

- Unzip locally and verify folder structure
- Ensure track has data/surfaces.ini
- Ensure car has data/ folder with data.acd or .ini files
- Check ZIP doesn't have nested folders

# Update System

The AC Server Manager includes an integrated update checking system that allows users to check for new versions directly from the Settings page.

## Features

- **Manual Update Check**: Click "Check for Updates" button in Settings
- **Version Comparison**: Automatically compares current version with latest GitHub release
- **Release Notes**: Displays changelog from GitHub releases
- **Direct Download**: Links to download the latest version
- **Update Notifications**: Visual indicators for available updates

## Configuration

### Setting Up GitHub Releases

To enable update checking, you need to configure the GitHub repository information:

1. Open `backend/src/services/updateService.js`
2. Update these constants at the top of the file:

```javascript
const GITHUB_OWNER = 'your-github-username'; // Your GitHub username
const GITHUB_REPO = 'ac-server-manager'; // Your repository name
```

### Creating Releases

When you want to publish a new version:

1. **Update version in package.json** (both frontend and backend):

   ```json
   {
     "version": "0.2.0"
   }
   ```

2. **Commit and tag the release**:

   ```bash
   git add .
   git commit -m "chore: bump version to 0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. **Create GitHub Release**:
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Select the tag you just created (v0.2.0)
   - Add a title: "Version 0.2.0"
   - Add release notes describing changes
   - Optionally attach compiled binaries (zip files, installers, etc.)
   - Click "Publish release"

## Version Format

The system uses semantic versioning (semver):

- Format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- Tags can optionally include `v` prefix (e.g., `v1.2.3`)
- The system automatically strips the `v` prefix when comparing versions

## API Endpoints

### Check for Updates

```http
GET /api/update/check
```

**Response**:

```json
{
  "updateAvailable": true,
  "currentVersion": "0.1.0",
  "latestVersion": "0.2.0",
  "releaseUrl": "https://github.com/user/repo/releases/tag/v0.2.0",
  "releaseNotes": "## What's New\n- Feature 1\n- Feature 2",
  "publishedAt": "2025-11-30T12:00:00Z",
  "assets": [
    {
      "name": "ac-server-manager-v0.2.0.zip",
      "size": 12345678,
      "downloadUrl": "https://github.com/..."
    }
  ]
}
```

### Get Current Version

```http
GET /api/update/version
```

**Response**:

```json
{
  "version": "0.1.0"
}
```

### Get Update Status

```http
GET /api/update/status
```

**Response**:

```json
{
  "checking": false,
  "currentVersion": "0.1.0"
}
```

## User Interface

The update check UI is located in **Settings** → **Application Updates**:

- Shows current version
- "Check for Updates" button
- Update status messages:
  - ✅ **Green**: You're up to date
  - 🔵 **Blue**: Update available with download link
  - 🔴 **Red**: Error checking for updates
- Release notes preview
- Direct download links for update assets

## Error Handling

The system gracefully handles:

- No internet connection
- GitHub API rate limiting
- Repository not found (404)
- No releases published yet
- Invalid version formats

## Future Enhancements

Potential features for future versions:

- [ ] Automatic update checks on app launch
- [ ] Background update downloads
- [ ] One-click update installation
- [ ] Update notifications in the UI header
- [ ] Auto-update settings (enable/disable)
- [ ] Update channel selection (stable/beta)

## Privacy

- No telemetry or tracking
- Only contacts GitHub API when user clicks "Check for Updates"
- No personal data transmitted

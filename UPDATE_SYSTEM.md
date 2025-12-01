# Update System Documentation

## Overview

The AC Server Manager now includes a complete update system with confirmation dialog for safe production updates. This is especially important for containerized deployments on platforms like Proxmox.

## Features

### 1. Update Checking

- Checks GitHub releases for new versions
- Compares current version with latest release
- Shows release notes and download links
- Manual check via Settings page

### 2. Automatic Update Application

- Git pull to fetch latest code
- NPM install to update dependencies
- Frontend rebuild
- Automatic server restart

### 3. Update Confirmation Modal

- Shows current version → new version
- Displays release notes preview
- Lists what will happen during update
- Requires explicit user confirmation
- Shows progress during installation
- Auto-reloads page after completion

## How It Works

### Backend (API)

#### Routes (`/api/update/...`)

- `GET /check` - Check for updates on GitHub
- `GET /version` - Get current app version
- `GET /status` - Get update check status
- `POST /apply` - Apply update and restart

#### Update Service

Located in `backend/src/services/updateService.js`

**Update Process:**

1. Verify git repository exists
2. Run `git pull` to fetch latest code
3. Run `npm install` in backend directory
4. Run `npm run build` in frontend directory
5. Respond to client
6. Wait 3 seconds (for response to send)
7. Exit process (Docker/PM2 restarts automatically)

### Frontend (UI)

#### Settings Page

Located in `frontend/src/pages/Settings.jsx`

**Update Flow:**

1. User clicks "Check for Updates"
2. If update available, shows version info and release notes
3. User clicks "Install Update" button
4. Confirmation modal appears with warning
5. User confirms or cancels
6. If confirmed, backend applies update
7. Page shows "Installing..." status
8. After 5 seconds, page auto-reloads

**Confirmation Modal Shows:**

- Current version → New version
- Warning about restart
- List of actions (pull, install, build, restart)
- Release notes preview
- Cancel and Install buttons
- Loading state during installation

## Usage

### For Users

1. Go to Settings page
2. Click "Check for Updates"
3. If update available, review the release notes
4. Click "Install Update"
5. Confirm in the modal
6. Wait for installation (30-60 seconds)
7. Page reloads automatically when complete

### For Docker Deployments

The update system works seamlessly with Docker:

- Container must have .git directory mounted
- Git must be installed in container (included in Dockerfile)
- Container restart policy should be `unless-stopped` or `always`
- Process exits with code 0, triggering restart

**Docker Compose Example:**

```yaml
services:
  ac-server-manager:
    restart: unless-stopped
    volumes:
      - ./.git:/app/.git:ro # Git history for updates
      - ./data:/app/data # Persistent data
```

### For PM2 Deployments

PM2 will automatically restart the process:

```bash
pm2 start backend/src/server.js --name ac-server-manager --watch false
```

When update completes, PM2 detects exit and restarts automatically.

## Configuration

### GitHub Repository

Edit `backend/src/services/updateService.js`:

```javascript
const GITHUB_OWNER = 'yourname';
const GITHUB_REPO = 'your-repo';
```

### Update Timing

- Response delay before restart: 3 seconds (in updateRoutes.js)
- Page reload delay: 5 seconds (in Settings.jsx)
- Adjust if needed for slower systems

## Security Considerations

### Production Deployment

1. **Git Branch:** Ensure you're on the correct branch (main/master)
2. **Permissions:** Git directory should be readable by app user
3. **Backups:** Always backup before updating (see PROXMOX_DEPLOYMENT.md)
4. **Network:** Requires internet access to GitHub
5. **Race Condition:** Confirmation prevents accidental updates during active sessions

### Confirmation Dialog

The confirmation modal prevents:

- Accidental updates during races
- Surprise restarts mid-session
- Updates without reviewing changes
- Data loss by showing what will happen

## Troubleshooting

### "Not a git repository" Error

- Ensure .git directory exists
- Check volume mount in Docker: `./.git:/app/.git:ro`
- Verify git is installed: `git --version`

### Update Hangs

- Check internet connection to GitHub
- Verify npm registry access
- Check build logs: `docker logs ac-server-manager`
- Increase restart delay if system is slow

### Page Doesn't Reload

- Clear browser cache
- Check if server restarted: `docker ps`
- Check logs for errors: `docker logs ac-server-manager`
- Manually refresh after 60 seconds

### Dependencies Fail to Install

- Check `package.json` for issues
- Verify npm registry is accessible
- Check disk space: `df -h`
- Try manual install: `docker exec ac-server-manager npm install`

## API Reference

### Check for Updates

```http
GET /api/update/check
```

**Response:**

```json
{
  "updateAvailable": true,
  "currentVersion": "0.13.6",
  "latestVersion": "0.14.0",
  "releaseUrl": "https://github.com/.../releases/tag/v0.14.0",
  "releaseNotes": "## What's New\n...",
  "publishedAt": "2024-01-15T12:00:00Z"
}
```

### Apply Update

```http
POST /api/update/apply
```

**Response:**

```json
{
  "success": true,
  "message": "Update applied successfully. Server will restart in 3 seconds.",
  "requiresRestart": true
}
```

### Get Current Version

```http
GET /api/update/version
```

**Response:**

```json
{
  "version": "0.13.6"
}
```

## Future Enhancements

- [ ] Rollback capability (git checkout previous version)
- [ ] Update scheduling (apply at specific time)
- [ ] Email notifications for new releases
- [ ] Automatic update checking (daily cron)
- [ ] Backup before update with auto-restore on failure
- [ ] Show commit log between versions
- [ ] Test mode (dry-run without applying)
- [ ] Multi-environment support (dev/staging/prod)

## Related Documentation

- [PROXMOX_DEPLOYMENT.md](./PROXMOX_DEPLOYMENT.md) - Containerized deployment guide
- [Dockerfile](./Dockerfile) - Container image definition
- [docker-compose.yml](./docker-compose.yml) - Multi-container setup

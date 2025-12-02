# AC Server Manager - Unified Installer System Summary

**Date:** December 1, 2025  
**Status:** ✅ FULLY FUNCTIONAL - Complete end-to-end installation working  
**Repository:** `Brewsker/ac-server-manager` (branch: `develop`)

---

## Current System State

### Infrastructure

- **Proxmox Host:** https://192.168.1.199:8006/
- **Git-Cache Container:** 998 @ 192.168.1.70/24
  - Purpose: Local repository cache for instant downloads
  - Version: 2 (tracked in `/etc/git-cache-version`)
  - Nginx serving: `http://192.168.1.70/ac-server-manager/`
  - Auto-rebuild when version mismatches
- **AC Server Container:** 999 @ 192.168.1.71/24 (static IP)
  - OS: Ubuntu 22.04 LTS
  - Node.js: v20.19.6
  - PM2: v6.0.14
  - App: AC Server Manager v0.15.1

### SSH Configuration

- **Status:** ✅ Password-less SSH working
- **Authentication Methods:**
  - SSH Key (primary): `~/.ssh/id_ed25519`
  - Password fallback: `admin`
- **Configuration Files:**
  - `.ssh-config` (version controlled master config)
  - `setup-ssh.ps1` (PowerShell maintenance script)
  - `SSH-README.md` (recovery documentation)

**Current SSH Test:**

```powershell
ssh root@192.168.1.71 "pm2 list"
# Output: Shows ac-server-manager running, NO password prompt
```

**Desired Output:**

```
┌────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                 │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ ac-server-manager    │ default     │ 0.15.1  │ cluster │ 9735     │ 24m    │ 0    │ online    │ 0%       │ 66.0mb   │ root     │ disabled │
└────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Core Components

### 1. Unified Installer

**Source:** `install-proxmox-unified.sh`

**Features:**

- One-command installation: `curl -fsSL "http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh" | bash`
- Auto-replace existing containers (`DESTROY_EXISTING=true`)
- Git-cache version checking and auto-rebuild
- SSH key injection for password-less access
- SSH password authentication enabled alongside keys
- Static IP configuration (192.168.1.71/24)
- Deploys web-based setup wizard

**Key Variables:**

```bash
CTID=999
HOSTNAME="ac-server"
PASSWORD="admin"
NETWORK_MODE="static"
STATIC_IP="192.168.1.71/24"
GIT_CACHE_VERSION="2"
USE_GIT_CACHE=true
```

**Current Execution:**

```bash
curl -fsSL "http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh" | bash
```

**Desired Output:**

```
═══════════════════════════════════════════════════════════════
  🏎️  AC Server Manager - Unified Installer v1.0.0-dev
═══════════════════════════════════════════════════════════════

✅ All prerequisites met
✅ Git-cache server available at 192.168.1.70
✅ Container 999 created
✅ SSH key injected - password-less SSH enabled
✅ Node.js installed: v20.19.6
✅ Setup wizard service started

🌐 Web Interface:
   Setup Wizard:    http://192.168.1.71:3001
```

### 2. Application Installer

**Source:** `install-server.sh`

**Features:**

- Non-interactive mode support
- Node.js 20 LTS installation (removes old versions first)
- PM2 ecosystem configuration
- Frontend build and backend setup
- Environment configuration with `NODE_ENV=production`

**Completion Marker:**

```bash
echo "=== SETUP_WIZARD_COMPLETE ==="
```

### 3. Setup Wizard

**Source:** `setup-wizard.html`, `setup-server.js`

**Features:**

- 4-step installation wizard UI
- Network configuration (DHCP/Static IP)
- Real-time SSE log streaming
- Update Wizard button
- Auto-exit after installation completes (5 second delay)

**Current Behavior:**

- Wizard accessible at: `http://192.168.1.71:3001`
- Detects `SETUP_WIZARD_COMPLETE` marker
- Exits via `process.exit(0)` after completion
- PM2 app takes over port 3001

**Desired Flow:**

1. User opens wizard
2. Clicks "Start Installation"
3. Logs stream in real-time
4. Installation completes → marker written
5. Wizard shows "Installation complete!"
6. Wizard service exits after 5 seconds
7. Browser auto-redirects to app at `http://192.168.1.71:3001`

### 4. PM2 Configuration

**Source:** `backend/ecosystem.config.cjs`

**Configuration:**

```javascript
module.exports = {
  apps: [
    {
      name: 'ac-server-manager',
      script: './src/server.js',
      cwd: '/opt/ac-server-manager/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/opt/ac-server-manager/backend/logs/error.log',
      out_file: '/opt/ac-server-manager/backend/logs/out.log',
    },
  ],
};
```

**Start Command:**

```bash
cd /opt/ac-server-manager/backend && pm2 start ecosystem.config.cjs && pm2 save
```

**Note:** File extension is `.cjs` due to `"type": "module"` in `package.json`

### 5. SSH Management System

**Source:** `setup-ssh.ps1`, `.ssh-config`, `SSH-README.md`

**Features:**

- Automatic SSH key generation
- Key injection into containers
- Configuration backup/restore
- Password-less authentication
- Fallback password support

**Usage:**

```powershell
# Verify all hosts
.\setup-ssh.ps1 verify

# Inject key into new container
.\setup-ssh.ps1 inject 192.168.1.71

# Restore configuration
.\setup-ssh.ps1 restore
```

**Current State:**

- ✅ 192.168.1.71 - Password-less SSH working
- ✅ 192.168.1.70 - Password-less SSH working
- ✅ Configuration version controlled
- ✅ Automatic backups in `ssh-backups/`

---

## Complete Installation Flow

### Developer's Preferred Workflow

**Step 1: Run Unified Installer (Proxmox)**

```bash
curl -fsSL "http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh" | bash
```

**Expected Outcome:**

- Container 999 destroyed (if exists) and recreated
- SSH keys injected
- Wizard running at http://192.168.1.71:3001

**Step 2: Access Setup Wizard (Browser)**

```
http://192.168.1.71:3001
```

**Expected Outcome:**

- 4-step wizard interface loads
- Network configuration pre-filled (192.168.1.71/24)

**Step 3: Run Installation (Wizard UI)**

- Click "Start Installation" button
- Monitor real-time logs via SSE stream

**Expected Outcome:**

```
✅ Node.js v20.19.6 installed
✅ PM2 installed and configured
✅ Dependencies installed and frontend built
✅ Application configured
✅ PM2 service configured
=== SETUP_WIZARD_COMPLETE ===
```

**Step 4: Auto-Transition to App**

- Wizard detects completion marker
- Shows "Installation complete!" message
- Wizard service exits after 5 seconds
- PM2 app starts on port 3001

**Expected Outcome:**

- Browser shows AC Server Manager app at http://192.168.1.71:3001
- Frontend fully loaded with dashboard UI
- No manual intervention required

**Step 5: Verify with SSH (Windows)**

```powershell
ssh root@192.168.1.71 "pm2 list"
```

**Expected Outcome:**

```
┌────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                 │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │
├────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ ac-server-manager    │ default     │ 0.15.1  │ cluster │ 9735     │ 1h     │ 0    │ online    │ 0%       │ 66.0mb   │
└────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┘
```

- **NO password prompt**
- App shows as `online`

---

## Known Issues & Fixes

### Issue 1: PM2 Not Auto-Starting

**Symptom:** Wizard completes but PM2 list shows no processes

**Root Cause:** `ecosystem.config.cjs` file missing from cloned repository (committed after install-server.sh was downloaded)

**Fix Applied:** Installer now removes old Node.js before installing v20, preventing conflicts

**Status:** ✅ RESOLVED

### Issue 2: Wizard Doesn't Exit After Completion

**Symptom:** Installation completes but wizard keeps running on port 3001, blocking PM2 app

**Root Cause:** `setup-server.js` detected completion but didn't call `process.exit()`

**Fix Applied:** Added auto-exit with 5-second delay after detecting `SETUP_WIZARD_COMPLETE`

**Source:** `setup-server.js` lines 173-180

```javascript
// Exit the wizard service after installation completes
console.log('[Setup] Installation complete - wizard will exit in 5 seconds');
setTimeout(() => {
  console.log('[Setup] Exiting wizard service - PM2 app should now be accessible');
  process.exit(0);
}, 5000);
```

**Status:** ✅ RESOLVED

### Issue 3: SSH Requires Password Every Time

**Symptom:** SSH constantly prompts for password despite key injection

**Root Cause:**

1. SSH config referencing non-existent keys (`id_ecdsa`)
2. Windows SSH client not using injected keys
3. Container SSH password auth disabled by default

**Fix Applied:**

1. Created `.ssh-config` with correct identity files
2. Added `IdentitiesOnly yes` to prevent fallback
3. Unified installer enables password auth alongside key auth
4. Created `setup-ssh.ps1` for key management

**Status:** ✅ RESOLVED

---

## Critical Files

### Version Controlled

- `install-proxmox-unified.sh` - Main installer
- `install-server.sh` - Application installer
- `setup-wizard.html` - Wizard UI
- `setup-server.js` - Wizard backend
- `backend/ecosystem.config.cjs` - PM2 configuration
- `.ssh-config` - SSH configuration template
- `setup-ssh.ps1` - SSH management script
- `SSH-README.md` - SSH recovery guide

### Runtime (Not Committed)

- `/var/log/installer.log` - Installation log with completion marker
- `/root/.pm2/dump.pm2` - PM2 saved process list
- `/opt/ac-server-manager/backend/.env` - Environment variables
- `~/.ssh/known_hosts` - SSH host keys
- `ssh-backups/` - SSH config backups

---

## Testing & Verification

### Full End-to-End Test

```bash
# On Proxmox
curl -fsSL "http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh" | bash

# Browser: http://192.168.1.71:3001
# Click "Start Installation"
# Wait for completion and auto-redirect

# On Windows
ssh root@192.168.1.71 "pm2 list"
# Should show: ac-server-manager | online | NO password prompt
```

### SSH Verification

```powershell
# Windows PowerShell
.\setup-ssh.ps1 verify

# Expected Output:
# [INFO] Verifying SSH access to all hosts...
# [OK] Password-less SSH working for 192.168.1.71
# [OK] Password-less SSH working for 192.168.1.70
#
# Results:
# [OK] 192.168.1.71 - Working
# [OK] 192.168.1.70 - Working
```

### Git-Cache Sync

```powershell
ssh root@192.168.1.70 "cd /opt/git-cache/ac-server-manager && git fetch origin develop && git reset --hard origin/develop && git log -1 --oneline"

# Expected Output:
# HEAD is now at 0babef2 MAJOR: Complete end-to-end installer working! Auto-exit wizard after completion
```

---

## Developer Preferences Summary

✅ **Zero-password SSH** - Keys injected automatically, password only as fallback  
✅ **One-command install** - No manual steps required  
✅ **Auto-replace containers** - Installer handles cleanup automatically  
✅ **Version-controlled config** - All critical files in git  
✅ **Instant updates** - Git-cache eliminates GitHub CDN delays  
✅ **Auto-transition** - Wizard → App without manual intervention  
✅ **Robust recovery** - SSH management tools for quick fixes

**Final Command State:**

```bash
# Proxmox: Start fresh install
curl -fsSL "http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh" | bash

# Windows: Verify SSH working
ssh root@192.168.1.71 "pm2 list"
# Expected: ac-server-manager online, NO password
```

---

**Last Updated:** December 1, 2025  
**Commit:** `0babef2` - "MAJOR: Complete end-to-end installer working! Auto-exit wizard after completion"

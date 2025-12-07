# Codebase Audit & Cleanup Plan

**Date**: December 3, 2025  
**Current Version**: 0.16.0  
**Status**: In Progress

## 🎯 Objectives

1. Fix version display (hardcoded in UI)
2. Clean up duplicate/orphaned files
3. Optimize folder structure
4. Refactor services for better organization
5. Improve deployment process

---

## 📊 Current State Analysis

### ✅ What's Working Well

- **Backend Architecture**: Clean service layer pattern
- **API Routes**: Well-organized RESTful structure
- **Version Management**: Backend reads from `package.json` correctly
- **Update System**: Existing `/api/update/version` endpoint
- **Content Detection**: New content status system working

### ❌ Issues Identified

#### 1. **Version Display Bug** (CRITICAL)

- **Location**: `frontend/src/components/Layout.jsx:231`
- **Issue**: Hardcoded `v0.15.1` instead of fetching from API
- **Impact**: Users see wrong version number
- **Fix**: Use existing `/api/update/version` endpoint

#### 2. **Deployment File Pollution**

- **Location**: Container `/opt/ac-server-manager/frontend/assets/`
- **Issue**: Multiple duplicate bundles from different builds
  ```
  index-Bx7U1F9v.js   (301K)
  index-CkD6PUR9.js   (300K)
  index-DA2w1EA7.js   (301K)
  index-DOC62Zof.js   (302K)
  index-DWVNncSZ.js   (301K)
  index-RmCQiAcX.js   (301K) ← Current/correct
  ```
- **Impact**: Wasted disk space, confusion about which bundle is active
- **Fix**: Clean assets before each deployment

#### 3. **Package Version Mismatch**

- **File**: `backend/package-lock.json:3`
- **Issue**: Shows `"version": "0.13.6"` (out of sync with package.json)
- **Fix**: Regenerate package-lock.json

#### 4. **Cursorrules Outdated**

- **File**: `.cursorrules:330`
- **Issue**: Documents version as `0.14.1`
- **Fix**: Update to `0.16.0`

#### 5. **Root Directory Clutter**

- Unnecessary files in root:
  - `ac-setup-wizard.service` - Unused service file
  - `setup-wizard.html` - Old setup wizard
  - `git-cache-server.sh` - Unclear purpose
  - `test-proxmox.sh`, `test-proxmox-dev.sh` - Test scripts
- Should be moved to `/scripts/` or `/deprecated/`

#### 6. **Backend Temp Directory**

- **Location**: `backend/temp/uploads/`
- Empty directory, should be in .gitignore

---

## 🔧 Implementation Plan

### **Phase 1: Critical Fixes** (Deploy Today)

#### 1.1 Fix Version Display ✅ READY TO IMPLEMENT

```jsx
// frontend/src/components/Layout.jsx
// Replace hardcoded version with API call

const [appVersion, setAppVersion] = useState('...');

useEffect(() => {
  const fetchVersion = async () => {
    try {
      const data = await api.getAppVersion();
      setAppVersion(data.version);
    } catch (error) {
      console.error('Failed to fetch version:', error);
    }
  };
  fetchVersion();
}, []);

// In render:
<p className="text-gray-400 text-sm mt-1">v{appVersion}</p>;
```

#### 1.2 Add API Client Method ✅ READY TO IMPLEMENT

```javascript
// frontend/src/api/client.js
export const getAppVersion = async () => {
  const response = await client.get('/update/version');
  return response.data;
};

// Add to default export:
export default {
  // ... existing exports
  getAppVersion,
};
```

#### 1.3 Update Cursorrules Version

```
- Current version: **0.16.0**
```

#### 1.4 Regenerate package-lock.json

```bash
cd backend
rm package-lock.json
npm install
```

**Deployment**: Use existing manual process, test before cleanup

---

### **Phase 2: Deployment System** (Tomorrow)

#### 2.1 Fix Deployment Script

Create working PowerShell deployment script that:

1. Cleans old assets first
2. Builds frontend
3. Deploys all files atomically
4. Verifies deployment
5. Restarts PM2

#### 2.2 Add Pre-deployment Cleanup

```bash
ssh root@host "pct exec CT_ID -- rm -rf /opt/ac-server-manager/frontend/assets/*"
ssh root@host "pct exec CT_ID -- rm -f /opt/ac-server-manager/frontend/index.html"
```

#### 2.3 Create Rollback Capability

Keep last 2 builds in `/opt/ac-server-manager/frontend-backups/`

---

### **Phase 3: Folder Structure Cleanup** ✅ COMPLETE

#### 3.1 Create Deprecated Directory ✅

```
/deprecated/
  ├── ac-setup-wizard.service
  ├── setup-wizard.html
  ├── git-cache-server.sh
  └── README.md (explaining what these were for)
```

**Status**: Complete - Created with documentation

#### 3.2 Organize Scripts ✅

```
/scripts/
  ├── deploy-to-proxmox.ps1
  ├── rollback-deployment.ps1
  ├── bump-version.ps1
  ├── commit.ps1
  ├── fix-pm2-env.sh
  ├── update-wizard.sh
  ├── README.md (documentation)
  ├── install/
  │   ├── install-proxmox-unified.sh (primary - Proxmox LXC installer)
  │   ├── install-server.sh (bare metal/inside container)
  │   ├── install.ps1 (Windows)
  │   └── setup-server.js (wizard helper)
  ├── testing/
  │   ├── test-proxmox.sh
  │   ├── test-proxmox-dev.sh
  │   ├── test-fresh-install.sh
  │   └── test-wizard-flow.sh
  └── ssh/
      ├── setup-ssh.ps1
      ├── ssh-manager.sh
      ├── SSH-README.md
      ├── .ssh-config
      └── ssh-backups/
```

**Status**: Complete - All scripts organized and documented

#### 3.3 Update .gitignore ✅

```gitignore
# Temporary files
backend/temp/
frontend/dist/

# Deployment backups (stored in container, not repo)
backups/

# SSH configuration (sensitive)
.ssh-config
ssh-backups/
```

**Status**: Complete - Updated to ignore temp dirs and sensitive files

---

### **Phase 4: Service Refactoring** (Next Week)

#### 4.1 Current Service Organization

```
backend/src/services/
├── banManager.js          (Player bans)
├── configManager.js       (INI file management)
├── configService.js       (Config API layer)
├── configStateManager.js  (Config state)
├── contentService.js      (Cars/tracks scanning)
├── contentUploadService.js (Upload handling)
├── entryService.js        (Entry list management)
├── playerManager.js       (Player data)
├── presetService.js       (Preset CRUD)
├── serverProcessManager.js (Process management)
├── serverService.js       (Server control)
├── setupService.js        (Setup wizard)
├── steamService.js        (Steam/AC installation)
└── updateService.js       (App updates)
```

#### 4.2 Proposed Refactoring

**Option A: Domain-Driven**

```
services/
├── config/
│   ├── ConfigManager.js       (Merge configManager + configService)
│   ├── ConfigStateManager.js  (Keep as-is)
│   └── PresetService.js       (Keep as-is)
├── content/
│   ├── ContentScanner.js      (Merge contentService + contentUploadService)
│   └── ContentInstaller.js    (New: handle Steam downloads)
├── server/
│   ├── ProcessManager.js      (Rename from serverProcessManager)
│   ├── ServerController.js    (Rename from serverService)
│   └── EntryListManager.js    (Rename from entryService)
├── players/
│   ├── PlayerManager.js       (Keep as-is)
│   └── BanManager.js          (Keep as-is)
├── platform/
│   ├── SteamService.js        (Keep as-is)
│   └── UpdateService.js       (Keep as-is)
└── setup/
    └── SetupService.js        (Keep as-is)
```

**Option B: Feature-Based (RECOMMENDED)**

```
services/
├── ServerManagement/          (Core server ops)
│   ├── ProcessManager.js
│   ├── ServerController.js
│   └── MultiInstanceManager.js (NEW - future multi-server)
├── Configuration/             (All config-related)
│   ├── ConfigManager.js
│   ├── PresetManager.js
│   └── EntryListManager.js
├── ContentManagement/         (Content handling)
│   ├── ContentScanner.js
│   ├── ContentInstaller.js
│   └── UploadHandler.js
├── PlayerManagement/          (Player data)
│   ├── PlayerTracker.js
│   ├── BanManager.js
│   └── SessionManager.js (NEW - track sessions)
└── Platform/                  (External integrations)
    ├── SteamIntegration.js
    ├── UpdateManager.js
    └── BackupManager.js (NEW - config backups)
```

#### 4.3 New Services to Add

1. **MultiInstanceManager.js**

   - Handle multiple AC server instances
   - Port allocation
   - Resource management

2. **SessionManager.js**

   - Track race sessions
   - Historical data
   - Statistics

3. **BackupManager.js**

   - Auto-backup configs before changes
   - Restore capability
   - Backup rotation

4. **LogManager.js**
   - Centralized logging
   - Log rotation
   - Log analysis

---

## 📋 Immediate Action Items

### Today (Critical)

- [ ] Fix version display in Layout.jsx
- [ ] Add getAppVersion to API client
- [ ] Deploy and verify version shows 0.16.0
- [ ] Update .cursorrules version

### Tomorrow

- [ ] Fix deployment script (remove smart quotes)
- [ ] Add cleanup step to deployment
- [ ] Test full deployment cycle
- [ ] Document deployment process

### This Week

- [ ] Reorganize root directory
- [ ] Create deprecated/ folder
- [ ] Reorganize scripts/ folder
- [ ] Update .gitignore
- [ ] Clean up container assets directory

### Next Week

- [ ] Plan service refactoring
- [ ] Decide on refactoring approach (A or B)
- [ ] Implement MultiInstanceManager skeleton
- [ ] Add SessionManager for race tracking

---

## 🎯 Success Criteria

1. ✅ Version displays correctly from API
2. ✅ Deployment script works reliably
3. ✅ No duplicate/orphaned files in production
4. ✅ Folder structure is logical and documented
5. ✅ Services follow consistent patterns
6. ✅ All temp/cache directories in .gitignore

---

## 📊 Metrics

### Before Cleanup

- Root directory files: 13
- Duplicate bundles in production: 6
- Hardcoded values: 2+ (version, paths)
- Package-lock version mismatch: Yes

### After Cleanup (Target)

- Root directory files: 4 (README, package files, docker-compose)
- Duplicate bundles: 0 (cleaned on each deploy)
- Hardcoded values: 0 (all from API/env)
- Package-lock version mismatch: No

---

## 🔄 Testing Strategy

### Phase 1 Testing

1. Deploy version fix
2. Verify browser shows v0.16.0
3. Check PM2 shows v0.16.0
4. Test `/api/update/version` endpoint

### Phase 2 Testing

1. Test deployment script on clean container
2. Verify all files deployed
3. Test rollback capability
4. Document any issues

### Phase 3 Testing

1. Verify moved files don't break anything
2. Check all scripts still work from new locations
3. Ensure .gitignore works correctly

### Phase 4 Testing

1. Unit test new service structure
2. Integration test with existing code
3. Performance benchmarks
4. Load testing with multiple instances

---

## Notes

- Keep backwards compatibility during refactoring
- Document all breaking changes
- Create migration guides
- Tag releases with semantic versioning

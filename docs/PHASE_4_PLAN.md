# Phase 4: Service Refactoring Plan

**Status**: 🚧 IN PROGRESS  
**Started**: December 3, 2025  
**Approach**: Incremental with testing after each step

---

## 🎯 Goals

1. **Better Organization**: Group related services by feature domain
2. **Maintainability**: Easier to find and modify code
3. **Scalability**: Foundation for multi-instance support
4. **Safety**: Incremental changes, test after each step

---

## 📦 Current State (14 Services)

```
backend/src/services/
├── banManager.js
├── configManager.js
├── configService.js              ← Overlap/redundancy
├── configStateManager.js
├── contentService.js
├── contentUploadService.js       ← Could merge
├── entryService.js
├── playerManager.js
├── presetService.js
├── serverProcessManager.js
├── serverService.js              ← Overlap with serverProcessManager?
├── setupService.js
├── steamService.js
└── updateService.js
```

---

## 🎨 Target Structure (Feature-Based)

```
backend/src/services/
├── ServerManagement/
│   ├── ProcessManager.js         ← serverProcessManager.js (renamed)
│   ├── ServerController.js       ← serverService.js (renamed + merged logic)
│   └── index.js                  (exports)
├── Configuration/
│   ├── ConfigManager.js          ← Merge configManager + configService
│   ├── ConfigStateManager.js     ← configStateManager.js (keep as-is)
│   ├── PresetManager.js          ← presetService.js (renamed)
│   ├── EntryListManager.js       ← entryService.js (renamed)
│   └── index.js                  (exports)
├── ContentManagement/
│   ├── ContentScanner.js         ← contentService.js (renamed)
│   ├── UploadHandler.js          ← contentUploadService.js (renamed)
│   └── index.js                  (exports)
├── PlayerManagement/
│   ├── PlayerManager.js          ← playerManager.js (keep as-is)
│   ├── BanManager.js             ← banManager.js (keep as-is)
│   └── index.js                  (exports)
├── Platform/
│   ├── SteamService.js           ← steamService.js (keep as-is)
│   ├── UpdateService.js          ← updateService.js (keep as-is)
│   └── index.js                  (exports)
└── Setup/
    ├── SetupService.js           ← setupService.js (keep as-is)
    └── index.js                  (exports)
```

---

## 📝 Implementation Steps

### Step 1: Create Directory Structure ✅

- [x] Create subdirectories
- [x] No code changes yet, just folders

### Step 2: Platform Services (Safest - No Dependencies)

- [ ] Move `steamService.js` → `Platform/SteamService.js`
- [ ] Move `updateService.js` → `Platform/UpdateService.js`
- [ ] Create `Platform/index.js` with exports
- [ ] Update imports in routes
- [ ] Test: Verify steam/update APIs work
- [ ] Commit: "refactor: move Platform services to subdirectory"

### Step 3: PlayerManagement Services

- [ ] Move `playerManager.js` → `PlayerManagement/PlayerManager.js`
- [ ] Move `banManager.js` → `PlayerManagement/BanManager.js`
- [ ] Create `PlayerManagement/index.js`
- [ ] Update imports in routes
- [ ] Test: Verify player/ban APIs work
- [ ] Commit: "refactor: move PlayerManagement services"

### Step 4: ContentManagement Services

- [ ] Move `contentService.js` → `ContentManagement/ContentScanner.js`
- [ ] Move `contentUploadService.js` → `ContentManagement/UploadHandler.js`
- [ ] Create `ContentManagement/index.js`
- [ ] Update imports in routes
- [ ] Test: Verify content scanning and upload works
- [ ] Test: Verify car/track thumbnails still load
- [ ] Commit: "refactor: move ContentManagement services"

### Step 5: Configuration Services (More Complex)

- [ ] Move `configStateManager.js` → `Configuration/ConfigStateManager.js`
- [ ] Move `presetService.js` → `Configuration/PresetManager.js`
- [ ] Move `entryService.js` → `Configuration/EntryListManager.js`
- [ ] Analyze `configManager.js` vs `configService.js` for redundancy
- [ ] Merge or keep separate based on analysis
- [ ] Create `Configuration/index.js`
- [ ] Update imports in routes
- [ ] Test: Verify all config operations work
- [ ] Test: Verify preset loading/saving
- [ ] Test: Verify entry list management
- [ ] Commit: "refactor: move Configuration services"

### Step 6: ServerManagement Services (Most Complex)

- [ ] Analyze `serverProcessManager.js` vs `serverService.js` overlap
- [ ] Move `serverProcessManager.js` → `ServerManagement/ProcessManager.js`
- [ ] Move `serverService.js` → `ServerManagement/ServerController.js`
- [ ] Merge duplicate functionality if found
- [ ] Create `ServerManagement/index.js`
- [ ] Update imports in routes
- [ ] Test: Verify server start/stop/restart works
- [ ] Test: Verify multi-server status polling
- [ ] Commit: "refactor: move ServerManagement services"

### Step 7: Setup Service

- [ ] Move `setupService.js` → `Setup/SetupService.js`
- [ ] Create `Setup/index.js`
- [ ] Update imports in routes
- [ ] Test: Setup wizard still works (if accessible)
- [ ] Commit: "refactor: move Setup service"

### Step 8: Cleanup Old Files

- [ ] Delete old service files from `backend/src/services/`
- [ ] Verify no broken imports
- [ ] Run full test suite
- [ ] Commit: "refactor: remove old service files"

### Step 9: Documentation

- [ ] Update README with new service structure
- [ ] Update CODEBASE_AUDIT.md (mark Phase 4 complete)
- [ ] Create SERVICE_ARCHITECTURE.md explaining organization
- [ ] Commit: "docs: update for new service architecture"

### Step 10: Deploy & Verify

- [ ] Build frontend (no changes but verify)
- [ ] Deploy to production using `deploy-to-proxmox.ps1`
- [ ] Verify all features work end-to-end
- [ ] Check PM2 logs for errors
- [ ] Test all API endpoints
- [ ] If issues: Rollback using `rollback-deployment.ps1`
- [ ] Commit: "chore: Phase 4 complete - v0.17.0"

---

## 🧪 Testing Checklist (After Each Step)

### Backend Services

- [ ] PM2 restarts without errors
- [ ] No import errors in logs
- [ ] All routes respond correctly
- [ ] Server start/stop operations work
- [ ] Config load/save works
- [ ] Content scanning works
- [ ] Player management works

### API Endpoints

- [ ] `/api/update/version` - Returns correct version
- [ ] `/api/content/status` - Returns car/track counts
- [ ] `/api/content/car-preview/:id` - Returns images
- [ ] `/api/content/track-preview/:id` - Returns images
- [ ] `/api/process/status` - Returns server statuses
- [ ] `/api/config/presets` - Returns presets list
- [ ] `/api/players` - Returns player list

### Frontend Features

- [ ] Dashboard loads without errors
- [ ] Config editor loads
- [ ] Car/track thumbnails display
- [ ] Server controls work (start/stop/restart)
- [ ] Preset management works
- [ ] Entry list editing works

---

## 🚨 Rollback Plan

If anything breaks during Phase 4:

1. **Immediate**: `.\scripts\rollback-deployment.ps1`
2. **Local**: `git reset --hard HEAD~1` (undo last commit)
3. **Verify**: Check backup files in `/opt/ac-server-manager/backups/`

---

## 📊 Success Criteria

- ✅ All 14 services successfully moved to subdirectories
- ✅ All imports updated (routes, services)
- ✅ Zero breaking changes to API
- ✅ All tests pass
- ✅ Production deployment successful
- ✅ No performance degradation
- ✅ Documentation updated

---

## 📈 Expected Outcomes

1. **Developer Experience**: Easier to navigate codebase
2. **Code Quality**: Clear separation of concerns
3. **Maintainability**: Related code grouped together
4. **Future-Ready**: Foundation for multi-instance support
5. **Documentation**: Clear service architecture

---

## ⏱️ Time Estimate

- **Steps 1-3**: ~30 minutes (low risk)
- **Steps 4-5**: ~45 minutes (medium risk)
- **Steps 6-7**: ~60 minutes (higher risk)
- **Steps 8-10**: ~30 minutes (testing + deployment)
- **Total**: ~2.5 hours (with careful testing)

---

## 🎓 Notes

- Each step is atomic and can be committed independently
- Testing after each step prevents cascading failures
- Rollback available at every commit
- No changes to business logic, only file organization
- Import paths will change but functionality stays the same

**Strategy**: Move slowly, test thoroughly, commit frequently

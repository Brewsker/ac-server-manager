# Installer & Wizard Testing Session Guide

**Testing Date:** December 1, 2025  
**Container:** Proxmox LXC 999  
**IP Address:** 192.168.1.71  
**Status:** Installation Complete, Testing Wizard Flow

---

## 🎯 Current Session Objectives

1. **Test Setup Wizard Flow** - First-time user experience
2. **Test Configuration Validation** - Path checking and error handling
3. **Test Wizard-to-App Transition** - Seamless experience without page refresh
4. **Test Service Persistence** - Configuration survives restarts
5. **Document Issues** - Track bugs and improvements needed

---

## ✅ Completed Steps

### 1. Installation via Script

```bash
pct exec 999 -- bash -c "NON_INTERACTIVE=yes bash /tmp/install.sh 2>&1 | tee /var/log/installer-manual.log"
```

**Result:** ✅ SUCCESS

- All dependencies installed
- PM2 service running
- Application accessible at http://192.168.1.71:3001
- AC Server not downloaded (as expected in non-interactive mode)

---

## 🧪 Current Testing Phase

### Test 1: Initial Wizard Access

**Steps:**

1. Open http://192.168.1.71:3001 in browser
2. Verify Setup Wizard appears (not main dashboard)
3. Check wizard displays correct initial state

**Expected Behavior:**

- Wizard should display welcome screen
- Auto-detect should run automatically in background
- Should show "configure" step since no AC installed
- No error messages on initial load

**Actual Results:**

- [ ] Document what you see when accessing the URL

---

### Test 2: Auto-Detection (Expected Failure)

**Steps:**

1. Click "🔍 Auto-Detect" button
2. Wait for response
3. Observe error handling

**Expected Behavior:**

- Should attempt to detect AC installation
- Should fail gracefully (no AC installed)
- Should show friendly message: "Could not auto-detect AC installation. Please specify path manually."
- No browser console errors

**Actual Results:**

- [ ] Document auto-detect behavior
- [ ] Check browser console (F12) for errors

---

### Test 3: Manual Path Entry (Invalid Path)

**Steps:**

1. Enter an invalid path: `/invalid/path`
2. Click "Validate & Continue →"
3. Observe validation error

**Expected Behavior:**

- Should send POST to `/api/setup/validate`
- Should return validation errors
- Should show error message in UI
- Should stay on configure step

**Actual Results:**

- [ ] Document validation error display
- [ ] Check if all expected errors shown

**Browser Console Check:**

```javascript
// Open browser console and check network tab
// Should see:
// POST /api/setup/validate
// Response: { valid: false, errors: [...] }
```

---

### Test 4: Upload AC Server Files (Manual Setup)

Since no AC server is installed, we need to either:

**Option A: Install via SteamCMD** (if you have Steam credentials)

```bash
pct enter 999

# Install SteamCMD
dpkg --add-architecture i386
apt-get update
apt-get install -y steamcmd

# Download AC Server
/usr/games/steamcmd +force_install_dir /opt/assetto-corsa-server \
  +login YOUR_STEAM_USERNAME \
  +app_update 302550 validate \
  +quit
```

**Option B: Use Mock/Test AC Server**

```bash
pct enter 999

# Create mock AC server structure for testing
mkdir -p /opt/assetto-corsa-server/server/cfg
mkdir -p /opt/assetto-corsa-server/content/cars
mkdir -p /opt/assetto-corsa-server/content/tracks

# Create dummy files
touch /opt/assetto-corsa-server/server/acServer.exe
chmod +x /opt/assetto-corsa-server/server/acServer.exe

# Create mock config files
cat > /opt/assetto-corsa-server/server/cfg/server_cfg.ini << 'EOF'
[SERVER]
NAME=Test Server
ADMIN_PASSWORD=admin123
EOF

cat > /opt/assetto-corsa-server/server/cfg/entry_list.ini << 'EOF'
[CAR_0]
MODEL=ks_audi_r8_plus
SKIN=white
EOF

echo "Mock AC Server created for testing"
```

---

### Test 5: Valid Path Entry

**Steps:**

1. Enter the AC server path in wizard: `/opt/assetto-corsa-server`
2. Click "Validate & Continue →"
3. Wait for validation

**Expected Behavior:**

- Should validate all required paths
- Should transition to "validating" step
- Should show validation success with all paths listed
- Should show "Save Configuration" button

**Actual Results:**

- [ ] Document validation success display
- [ ] Verify all 4 paths shown correctly:
  - AC_SERVER_PATH
  - AC_SERVER_CONFIG_PATH
  - AC_ENTRY_LIST_PATH
  - AC_CONTENT_PATH

---

### Test 6: Save Configuration

**Steps:**

1. Click "Save Configuration" button
2. Wait for response
3. Observe UI changes

**Expected Behavior:**

- Should send POST to `/api/setup/configure`
- Should update `.env` file in backend
- Should transition from wizard to main dashboard
- Should happen without page refresh
- Main dashboard should load

**Actual Results:**

- [ ] Document save process
- [ ] Check if wizard disappears
- [ ] Check if dashboard loads
- [ ] Time the transition (should be < 1 second)

**Backend Verification:**

```bash
# On Proxmox host, check .env file was updated
pct exec 999 -- cat /opt/ac-server-manager/backend/.env | grep AC_SERVER
```

Expected output:

```
AC_SERVER_PATH=/opt/assetto-corsa-server/server/acServer.exe
AC_SERVER_CONFIG_PATH=/opt/assetto-corsa-server/server/cfg/server_cfg.ini
AC_ENTRY_LIST_PATH=/opt/assetto-corsa-server/server/cfg/entry_list.ini
AC_CONTENT_PATH=/opt/assetto-corsa-server/content
```

---

### Test 7: Verify Main App Access

**Steps:**

1. After wizard completes, verify dashboard displays
2. Navigate to different pages
3. Check all UI elements load correctly

**Expected Behavior:**

- Dashboard shows server status
- Navigation menu works
- Server controls visible
- No wizard reappears

**Actual Results:**

- [ ] Document main app state
- [ ] Check if server controls work
- [ ] Try navigating to /config, /active-drivers, etc.

---

### Test 8: Service Restart (Configuration Persistence)

**Steps:**

1. From Proxmox host, restart PM2 service:
   ```bash
   pct exec 999 -- pm2 restart ac-server-manager
   ```
2. Wait 5 seconds
3. Refresh browser (hard refresh: Ctrl+Shift+R)
4. Observe behavior

**Expected Behavior:**

- After restart, browser refresh should load main dashboard
- Should NOT show wizard again
- Configuration should persist
- `/api/setup/status` should return `configured: true`

**Actual Results:**

- [ ] Document what loads after restart
- [ ] Check PM2 logs if issues: `pct exec 999 -- pm2 logs ac-server-manager`

---

### Test 9: Force Wizard Re-Appearance (Reset Test)

**Steps:**

1. Clear `.env` configuration:
   ```bash
   pct exec 999 -- bash -c "cd /opt/ac-server-manager/backend && cp .env.example .env"
   ```
2. Restart service:
   ```bash
   pct exec 999 -- pm2 restart ac-server-manager
   ```
3. Hard refresh browser
4. Verify wizard appears again

**Expected Behavior:**

- Wizard should re-appear
- Should start from configure step
- Previous paths should not be pre-filled

**Actual Results:**

- [ ] Document reset behavior
- [ ] Verify wizard appears correctly

---

## 🐛 Known Issues to Check

### Browser Console Errors

- [ ] Any React errors or warnings?
- [ ] Any network request failures?
- [ ] Any CORS issues?

### UI/UX Issues

- [ ] Buttons responsive and properly styled?
- [ ] Loading states show correctly?
- [ ] Error messages clear and helpful?
- [ ] Success messages encouraging?

### Backend Issues

- [ ] PM2 logs show any errors?
- [ ] API endpoints return correct status codes?
- [ ] .env file updates correctly?

### Edge Cases

- [ ] What happens if you enter path with spaces?
- [ ] What happens if you enter Windows-style path (C:\...)?
- [ ] What happens if path exists but files are missing?
- [ ] What happens if backend is down during wizard?

---

## 📝 Testing Commands Reference

### Proxmox Host Commands

```bash
# Enter container
pct enter 999

# View PM2 logs
pct exec 999 -- pm2 logs ac-server-manager --lines 50

# Check PM2 status
pct exec 999 -- pm2 status

# Restart service
pct exec 999 -- pm2 restart ac-server-manager

# Check .env file
pct exec 999 -- cat /opt/ac-server-manager/backend/.env

# Check network connectivity
pct exec 999 -- curl -I http://localhost:3001/health

# Monitor real-time logs
pct exec 999 -- pm2 logs ac-server-manager
```

### Browser Testing

```javascript
// Check API directly in browser console
fetch('/api/setup/status')
  .then((r) => r.json())
  .then(console.log);

fetch('/api/setup/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: '/opt/assetto-corsa-server' }),
})
  .then((r) => r.json())
  .then(console.log);
```

---

## 📊 Test Results Summary

### Test Status

- [ ] Test 1: Initial Wizard Access
- [ ] Test 2: Auto-Detection
- [ ] Test 3: Invalid Path Validation
- [ ] Test 4: AC Server Setup
- [ ] Test 5: Valid Path Entry
- [ ] Test 6: Save Configuration
- [ ] Test 7: Main App Access
- [ ] Test 8: Service Restart
- [ ] Test 9: Reset Test

### Issues Found

```
Issue #1: [Description]
Severity: Critical/High/Medium/Low
Steps to reproduce:
Expected behavior:
Actual behavior:
```

### Performance Metrics

- Wizard load time: \_\_\_ms
- Validation response time: \_\_\_ms
- Configuration save time: \_\_\_ms
- Wizard-to-app transition time: \_\_\_ms

---

## 🚀 Next Steps After Testing

1. **Fix Critical Issues** - Any bugs that prevent wizard completion
2. **Improve Error Messages** - Make them more user-friendly
3. **Add Loading States** - Better visual feedback during async operations
4. **Test on Fresh Install** - Rebuild container and test full flow again
5. **Test With Real AC Server** - Download via Steam and test with actual files
6. **Test Update System** - Verify updates don't break wizard detection
7. **Document Findings** - Update README and docs with testing results

---

## 💡 Testing Tips

1. **Use Browser DevTools** - Network tab shows all API calls
2. **Check PM2 Logs** - Real-time backend error tracking
3. **Test Mobile** - Responsive design verification
4. **Test Dark Mode** - If implemented, verify wizard theming
5. **Test Slow Network** - Throttle network in DevTools
6. **Test Timeouts** - What happens if API is slow?
7. **Test Refresh** - Hard refresh (Ctrl+Shift+R) between steps

---

## 📞 Support Information

- **GitHub Repo:** https://github.com/Brewsker/ac-server-manager
- **Container ID:** 999
- **Container IP:** 192.168.1.71
- **Web Interface:** http://192.168.1.71:3001
- **Backend Port:** 3001
- **AC Server Port:** 9600 (when configured)

---

**Start Testing:** Open http://192.168.1.71:3001 and begin with Test 1!

Good luck! 🏁

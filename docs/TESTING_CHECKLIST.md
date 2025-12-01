# Deployment Testing Checklist

Complete testing protocol before releasing the one-click installer to users.

## 🎯 Test Environments

### Required Test Platforms

- [ ] Ubuntu 22.04 LTS (clean install)
- [ ] Ubuntu 20.04 LTS (clean install)
- [ ] Debian 11 (clean install)
- [ ] Proxmox LXC (Ubuntu 22.04 template)
- [ ] Windows 10/11 (local dev with install.ps1)

### Optional Test Platforms

- [ ] Ubuntu 24.04 LTS
- [ ] Debian 12
- [ ] Cloud VPS (DigitalOcean, Linode, Vultr)
- [ ] AWS EC2 instance
- [ ] Raspberry Pi 4 (4GB+ RAM)

---

## 🧪 Test Scenarios

### Scenario 1: Fresh Ubuntu Server (No AC Server)

**Goal:** Test full installation without AC server download

```bash
# Spin up clean Ubuntu 22.04 VM
# Run installer
curl -sSL <installer-url> | sudo bash

# Choose:
# - Full Installation (Node.js + PM2)
# - Skip AC download
# - Default paths
```

**Expected Result:**

- ✅ System packages installed
- ✅ Node.js 20 installed
- ✅ PM2 installed and configured
- ✅ App cloned from Git
- ✅ Dependencies installed
- ✅ Frontend built
- ✅ Service started
- ✅ Health check passes
- ✅ Web UI accessible on port 3001
- ✅ Setup Wizard shows (no AC server detected)

**Test Checklist:**

- [ ] Installer completes without errors
- [ ] `pm2 status` shows service running
- [ ] `curl http://localhost:3001/health` returns OK
- [ ] Browser access to http://SERVER_IP:3001 works
- [ ] Setup Wizard appears
- [ ] Can manually set AC paths in wizard
- [ ] Logs show no errors: `pm2 logs ac-server-manager`

---

### Scenario 2: Fresh Ubuntu Server (With Steam AC Download)

**Goal:** Test SteamCMD integration and AC server download

```bash
# Clean Ubuntu 22.04 VM
curl -sSL <installer-url> | sudo bash

# Choose:
# - Full Installation
# - YES to download AC server
# - Enter Steam credentials
# - Enter Steam Guard code when prompted
```

**Expected Result:**

- ✅ All from Scenario 1, plus:
- ✅ SteamCMD installed
- ✅ AC Dedicated Server downloaded
- ✅ AC server executable found
- ✅ Paths auto-configured in .env
- ✅ Setup Wizard pre-filled with paths
- ✅ Can start AC server from UI

**Test Checklist:**

- [ ] SteamCMD authenticates successfully
- [ ] AC server downloads completely (~3GB)
- [ ] `/opt/assetto-corsa-server/acServer` exists
- [ ] Server is executable: `chmod +x` applied
- [ ] `.env` has correct AC paths
- [ ] Setup Wizard shows green checkmarks
- [ ] Can start/stop AC server from UI
- [ ] AC server logs appear in monitoring

**Steam Guard Testing:**

- [ ] Works with email code
- [ ] Works with mobile authenticator
- [ ] Handles invalid code gracefully
- [ ] Can retry after failed attempt

---

### Scenario 3: Docker Installation

**Goal:** Test containerized deployment

```bash
# Clean server
curl -sSL <installer-url> | sudo bash

# Choose:
# - Docker Installation
# - Skip AC download (will mount external)
```

**Expected Result:**

- ✅ Docker and Docker Compose installed
- ✅ App cloned
- ✅ docker-compose.yml configured
- ✅ Container built
- ✅ Container running
- ✅ Health check passes
- ✅ Web UI accessible

**Test Checklist:**

- [ ] `docker ps` shows container running
- [ ] `docker-compose logs` shows no errors
- [ ] Health check endpoint responds
- [ ] Browser access works
- [ ] Can restart container
- [ ] Volumes persist data after restart
- [ ] Update system works in container

---

### Scenario 4: Existing Node.js Installation

**Goal:** Test app-only installation mode

```bash
# Server with Node.js 18+ already installed
curl -sSL <installer-url> | sudo bash

# Choose:
# - App Only
# - Skip AC download
```

**Expected Result:**

- ✅ Skips Node.js installation
- ✅ Uses existing Node.js
- ✅ Installs app only
- ✅ User must manually start service

**Test Checklist:**

- [ ] Detects existing Node.js
- [ ] Skips NodeSource repository setup
- [ ] Installs dependencies successfully
- [ ] Builds frontend
- [ ] Provides startup command
- [ ] Manual `npm start` works

---

### Scenario 5: Windows Local Development

**Goal:** Test install.ps1 on Windows

```powershell
# Clean Windows 10/11 with Node.js installed
.\install.ps1
```

**Expected Result:**

- ✅ Checks Node.js installed
- ✅ Installs backend dependencies
- ✅ Installs frontend dependencies
- ✅ Creates .env from example
- ✅ Starts backend in new terminal
- ✅ Starts frontend in new terminal
- ✅ Opens browser automatically
- ✅ Setup Wizard appears

**Test Checklist:**

- [ ] Node.js version check works
- [ ] Warns if Node.js missing
- [ ] Both terminals open and start services
- [ ] Browser opens to http://localhost:5173
- [ ] Setup Wizard auto-detects AC (if installed)
- [ ] Can complete setup wizard
- [ ] Services restart after wizard

---

### Scenario 6: Proxmox LXC Container

**Goal:** Test in production-like containerized environment

```bash
# Create Ubuntu 22.04 LXC with:
# - 2 CPU cores
# - 2GB RAM
# - 20GB disk
# - Nesting enabled

# Inside container:
curl -sSL <installer-url> | sudo bash

# Choose Docker installation
```

**Expected Result:**

- ✅ Docker works in LXC (nesting enabled)
- ✅ Container deploys successfully
- ✅ Network accessible from Proxmox host
- ✅ Can access from external network
- ✅ Survives LXC container restart

**Test Checklist:**

- [ ] LXC nesting allows Docker
- [ ] No permission issues
- [ ] Port forwarding works
- [ ] Performance acceptable
- [ ] Backup/restore works
- [ ] Update system works

---

## 🔍 Error Condition Testing

### Network Failures

- [ ] Test with no internet (should fail gracefully)
- [ ] Test with firewall blocking GitHub (clone fails)
- [ ] Test with DNS issues
- [ ] Test with slow connection (timeout handling)

### Steam Authentication Failures

- [ ] Wrong password (should retry)
- [ ] Wrong username (should retry)
- [ ] Invalid Steam Guard code (should retry)
- [ ] Account without AC ownership (should fail gracefully)
- [ ] Steam servers down (should show error)

### Filesystem Issues

- [ ] Test with full disk (should detect)
- [ ] Test with permission denied (should show error)
- [ ] Test with existing installation (should prompt)
- [ ] Test with corrupted .env (should recreate)

### Port Conflicts

- [ ] Port 3001 already in use
- [ ] Port 9600 already in use (AC server)
- [ ] All ports blocked by firewall

### Resource Constraints

- [ ] Server with 1GB RAM (should warn)
- [ ] Server with 1 CPU core (should work but slow)
- [ ] Slow disk I/O (should complete but slowly)

---

## ✅ Acceptance Criteria

For each test scenario, verify:

### Installation Success

- [ ] No errors in installer output
- [ ] All components installed
- [ ] Service starts automatically
- [ ] Health check passes
- [ ] No zombie processes

### Post-Installation Functionality

- [ ] Web UI loads
- [ ] Setup Wizard works
- [ ] Can save configuration
- [ ] Can start/stop AC server
- [ ] Can create server configs
- [ ] Can manage entry lists
- [ ] Can upload content (tracks/cars)

### Service Management

- [ ] Service survives reboot
- [ ] Service auto-restarts on crash
- [ ] Logs are accessible
- [ ] Can manually restart
- [ ] Can manually stop/start

### Update System

- [ ] Can check for updates
- [ ] Can install updates
- [ ] Update confirmation works
- [ ] Auto-restart after update
- [ ] No data loss after update

### Security

- [ ] Firewall rules applied
- [ ] No sensitive data in logs
- [ ] Steam credentials not stored
- [ ] Service runs with appropriate permissions
- [ ] No exposed secrets in config files

---

## 📊 Performance Benchmarks

### Installation Time

- **Target:** < 10 minutes (without AC download)
- **Measure:** Time from script start to health check pass
- **With AC:** < 20 minutes (depends on connection speed)

### Resource Usage

- **RAM (PM2):** < 150MB idle
- **RAM (Docker):** < 250MB idle
- **CPU:** < 5% idle
- **Disk:** < 500MB (app only, excludes AC server)

### First Startup

- **Backend:** < 5 seconds to ready
- **Frontend:** Instant (pre-built)
- **Health check:** < 1 second response

### AC Server Control

- **Start:** < 3 seconds
- **Stop:** < 2 seconds
- **Restart:** < 5 seconds

---

## 🐛 Known Issues to Watch For

### Common Problems

- [ ] SteamCMD hangs on Steam Guard prompt
- [ ] PM2 doesn't survive reboot (startup script)
- [ ] Docker permission denied in LXC
- [ ] Frontend build fails on low RAM
- [ ] AC server ports already in use

### Edge Cases

- [ ] Install on non-English system
- [ ] Install with custom SSH port
- [ ] Install behind corporate proxy
- [ ] Install on ARM architecture
- [ ] Install with SELinux enabled

---

## 📝 Pre-Release Checklist

Before tagging v1.0 or promoting installer:

### Code Quality

- [ ] All shell script variables quoted
- [ ] Proper error handling (set -e)
- [ ] All paths absolute
- [ ] No hardcoded passwords
- [ ] Logging comprehensive
- [ ] Comments explain complex sections

### Documentation

- [ ] SERVER_INSTALL.md complete
- [ ] All commands tested
- [ ] Screenshots added (optional)
- [ ] Troubleshooting section comprehensive
- [ ] Security notes included

### Testing

- [ ] All scenarios pass
- [ ] All platforms tested
- [ ] Error conditions handled
- [ ] Performance benchmarks met
- [ ] No regression in existing features

### Security

- [ ] No secrets committed
- [ ] Installer served over HTTPS
- [ ] Checksums provided
- [ ] GPG signature (optional)
- [ ] Security advisory process documented

### Support

- [ ] GitHub issues enabled
- [ ] Discussion forum ready
- [ ] Support email monitored
- [ ] FAQ created

---

## 🚀 Release Process

1. **Final Testing Round**

   - Run all scenarios
   - Document any issues
   - Fix critical bugs

2. **Update Documentation**

   - Verify all links work
   - Update version numbers
   - Add release notes

3. **Create Release**

   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0: Production ready"
   git push origin v1.0.0
   ```

4. **Publish Installer**

   - Upload to GitHub releases
   - Create install link: `https://raw.githubusercontent.com/.../install-server.sh`
   - Test curl command works

5. **Announce**
   - Update README
   - Post to community forums
   - Social media announcement
   - Email existing users

---

## 📞 Support Plan

### During Beta

- Active monitoring of installs
- Quick response to issues
- Willingness to remote debug
- Regular updates based on feedback

### Post-Release

- GitHub issues for bugs
- Discussions for questions
- Monthly update cycle
- Security patches ASAP

---

## ✨ Success Metrics

Target for v1.0 release:

- **Installation success rate:** > 95%
- **Average install time:** < 15 minutes
- **User satisfaction:** > 4.5/5
- **GitHub stars:** > 100 (stretch goal)
- **Active deployments:** > 50 servers

---

**Last Updated:** December 1, 2025  
**Status:** Ready for testing

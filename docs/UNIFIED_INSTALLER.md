# Unified Installer - Quick Reference

## 🚀 One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/install-proxmox-unified.sh | bash
```

---

## 📋 What It Does

1. ✅ Creates Proxmox LXC container
2. ✅ Installs Node.js 20
3. ✅ Deploys web-based setup wizard
4. ✅ Starts wizard service
5. ✅ Provides web URL to complete installation

---

## 🎯 Usage Examples

### Basic Installation

```bash
# Default settings (container 999, 4GB RAM, 60GB disk)
./install-proxmox-unified.sh
```

### Custom Configuration

```bash
# Custom container with debugging
./install-proxmox-unified.sh \
  --ctid 100 \
  --hostname my-ac-server \
  --memory 8192 \
  --disk 100 \
  --cores 4 \
  --debug
```

### Replace Existing Container

```bash
# Destroy and recreate container 999 with debug output
./install-proxmox-unified.sh --destroy --debug
```

---

## ⚙️ Options

| Option              | Description                | Default        |
| ------------------- | -------------------------- | -------------- |
| `--ctid <id>`       | Container ID               | 999            |
| `--hostname <name>` | Container hostname         | ac-server      |
| `--memory <MB>`     | Memory in MB               | 4096           |
| `--disk <GB>`       | Disk size in GB            | 60             |
| `--cores <n>`       | CPU cores                  | 2              |
| `--storage <name>`  | Storage pool               | local-lvm      |
| `--password <pwd>`  | Root password              | auto-generated |
| `--destroy`         | Destroy existing container | false          |
| `--debug`           | Enable verbose debugging   | false          |

---

## 🔍 Debug Mode

Enable verbose debugging to see detailed progress:

```bash
./install-proxmox-unified.sh --debug
```

Debug mode shows:

- ✅ All command outputs
- ✅ Step-by-step progress
- ✅ Container configuration
- ✅ Service status checks
- ✅ Network connectivity tests

---

## 📝 After Installation

1. **Access the Setup Wizard**

   ```
   http://[CONTAINER_IP]:3001
   ```

2. **Configure Installation Options**

   - Choose installation type
   - Set AC server path
   - Configure Steam download (optional)

3. **Wizard Auto-Installs**

   - Downloads AC Server Manager
   - Installs dependencies
   - Builds frontend
   - Starts PM2 service

4. **Access Main Application**
   ```
   http://[CONTAINER_IP]:3001
   ```

---

## 🐛 Troubleshooting

### Check Service Status

```bash
pct exec 999 -- systemctl status ac-setup-wizard
```

### View Service Logs

```bash
pct exec 999 -- journalctl -u ac-setup-wizard -f
```

### Check Wizard Accessibility

```bash
pct exec 999 -- curl http://localhost:3001/setup
```

### View Installation Log

Check the log file path shown at the end of installation:

```bash
cat /tmp/ac-installer-YYYYMMDD-HHMMSS.log
```

### Enter Container

```bash
pct enter 999
```

---

## 📂 File Locations

| Component           | Path                                          |
| ------------------- | --------------------------------------------- |
| Setup Wizard        | `/opt/ac-setup/`                              |
| Wizard Service      | `/etc/systemd/system/ac-setup-wizard.service` |
| App (after install) | `/opt/ac-server-manager/`                     |
| AC Server           | `/opt/assetto-corsa-server/`                  |
| Installation Log    | `/tmp/ac-installer-*.log`                     |

---

## 🔄 Testing Flow

```bash
# 1. Run unified installer with debug
./install-proxmox-unified.sh --destroy --debug

# 2. Note the container IP from output
# Example: 192.168.1.71

# 3. Open in browser
# http://192.168.1.71:3001

# 4. Complete setup wizard
# - Select installation type
# - Configure AC server paths
# - Start installation

# 5. Wait for installation to complete
# Monitor in browser or check logs

# 6. Access main app
# http://192.168.1.71:3001
```

---

## ✅ Success Indicators

After running the unified installer, you should see:

```
✅ All prerequisites met
✅ Container 999 created
✅ Container started and responsive
✅ Container IP: 192.168.1.71
✅ Bootstrap packages installed
✅ Node.js installed: v20.x.x
✅ Setup wizard files deployed
✅ Setup wizard service started
✅ Setup wizard is accessible
✅ Firewall rules configured

🎉 Installation Complete!

📍 Container Information:
   Container ID:    999
   Hostname:        ac-server
   IP Address:      192.168.1.71
   Root Password:   [auto-generated]

🌐 Web Interface:
   Setup Wizard:    http://192.168.1.71:3001
```

---

## 🚨 Common Issues

### Issue: Container already exists

**Solution:** Use `--destroy` flag to replace it

```bash
./install-proxmox-unified.sh --destroy
```

### Issue: Template not found

**Solution:** Script auto-downloads Ubuntu 22.04 template

### Issue: Wizard not accessible

**Check:**

1. Service status: `pct exec 999 -- systemctl status ac-setup-wizard`
2. Port listening: `pct exec 999 -- netstat -tlnp | grep 3001`
3. Firewall: `pct exec 999 -- ufw status`

### Issue: Node.js installation fails

**Check:** Container internet connectivity

```bash
pct exec 999 -- ping -c 3 google.com
```

---

## 📊 Development Testing Checklist

- [ ] Script downloads without errors
- [ ] Container creates successfully
- [ ] Node.js installs correctly
- [ ] Wizard files download
- [ ] Service starts and stays running
- [ ] Wizard accessible via browser
- [ ] Can complete installation through wizard
- [ ] Main app starts after wizard completes
- [ ] Configuration persists after restart
- [ ] Debug mode provides useful output
- [ ] Error handling works correctly
- [ ] Log file contains full trace

---

## 🔗 Related Files

- `install-proxmox-unified.sh` - This unified installer
- `setup-wizard.html` - Web wizard interface
- `setup-server.js` - Wizard backend server
- `install-server.sh` - Main app installer (called by wizard)
- `ac-setup-wizard.service` - Systemd service file

---

**Version:** 1.0.0-dev  
**Last Updated:** December 1, 2025  
**Status:** Development/Testing

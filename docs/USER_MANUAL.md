# AC Server Manager - User Manual

**Version:** 0.28.13+  
**Platform:** Proxmox LXC, Linux, Windows  
**Quick Start:** 5 minutes from installation to running server

---

## 🚀 Quick Start

### Installation (Proxmox LXC - Recommended)

Run this single command on your Proxmox host:

```bash
curl -fsSL "https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/scripts/install/install-proxmox-unified.sh" | bash
```

**What happens:**
1. Creates Ubuntu 22.04 LXC container (ID 999)
2. Configures network (static IP: 192.168.1.71)
3. Installs dependencies (Node.js 20, PM2)
4. Deploys setup wizard
5. Opens browser to http://192.168.1.71:3001

**Next:** Complete the setup wizard (see below).

For other installation methods, see [INSTALLATION.md](./INSTALLATION.md).

---

## 🎯 First Launch - Setup Wizard

After installation, the setup wizard guides you through initial configuration:

### Step 1: Choose Installation Type

- **Full Installation** (Recommended) - Installs everything automatically
- **App Only** - If you have Node.js already installed

### Step 2: Network Configuration

Pre-configured for Proxmox installations. For custom setups, enter your network details.

### Step 3: Start Installation

Click **"Get Started"** → **"Continue"**

The wizard will:
- Clone application from repository
- Install dependencies
- Build frontend
- Configure PM2 process manager
- Auto-exit when complete

**Your browser will automatically refresh** to show the main application.

---

## 📊 Using the Manager

### Dashboard Overview

The main dashboard shows:

- **Server Status** - Running/Stopped indicator
- **Active Configuration** - Current server settings
- **Quick Actions** - Start, Stop, Restart buttons
- **Version Info** - Current app version with update checker

### Creating Server Configurations

#### 1. Select Content

**Tracks:**
- Click **"Select Track"** button
- Browse available tracks
- Double-click to select or click + Select

**Cars:**
- Click **"Select Cars"** button  
- Choose one or multiple cars
- Selected cars appear in the main editor

#### 2. Configure Server Settings

**Server Tab:**
- Server name, password, admin password
- Max clients, UDP/TCP ports
- Session settings (practice, qualifying, race)

**Session Tab:**
- Practice length
- Qualifying length
- Race laps/time
- Join type, allowed tires

**Rules Tab:**
- Damage multiplier
- Fuel consumption
- Tire wear
- Assists allowed

**Weather Tab:**
- Select weather preset
- Graphics settings
- Ambient temperature

#### 3. Save Configuration

Click **"Save Preset"** to store your configuration for future use.

### Managing Presets

**Sidebar:**
- Lists all saved presets
- Click any preset to load it
- Edit and save changes

**Actions:**
- **Rename** - Right-click preset → Rename
- **Delete** - Right-click preset → Delete
- **Duplicate** - Load preset → Modify → Save As New

### Starting/Stopping the Server

**Start Server:**
1. Select or create a configuration
2. Click **"Run"** or **"Start Server"**
3. Wait for status to show "Running"

**Stop Server:**
1. Click **"Stop Server"** in dashboard
2. Server shuts down gracefully

**Restart Server:**
1. Click **"Restart Server"**
2. Applies configuration changes automatically

---

## 📦 Content Management

### Uploading Custom Content

**Location:** Settings → Content Management

**Upload Track:**
1. Prepare track as ZIP file
2. Click "Choose File" under Track Upload
3. Select ZIP file
4. Upload automatically installs and makes available

**Upload Car:**
1. Prepare car as ZIP file
2. Click "Choose File" under Car Upload
3. Select ZIP file
4. Upload automatically installs and makes available

**ZIP Structure Requirements:** See [CONTENT_UPLOAD.md](./CONTENT_UPLOAD.md) for details.

### Scanning for Content

If you manually add content to the AC server directory:

1. Go to Settings
2. Click **"Scan Content"**
3. New tracks/cars appear in selection modals

---

## 🔄 Updates

### Checking for Updates

**Automatic Check:**
- Version indicator shows "Update Available" badge when new version detected

**Manual Check:**
1. Click version number in sidebar
2. Shows current version and latest available version

### Applying Updates

**Important:** Updates are git-based and rebuild the application.

1. Click **"Update Available"** badge or version number
2. Review update details in modal
3. Click **"Update Now"**
4. Application automatically:
   - Pulls latest code from repository
   - Installs new dependencies
   - Rebuilds frontend
   - Restarts backend

**Note:** Server will be stopped during update. Active races will be interrupted.

---

## 🛠️ Troubleshooting

### Server Won't Start

**Check:**
- Is another server using the same port?
- Are UDP/TCP ports available (not blocked by firewall)?
- Is Assetto Corsa server executable accessible?

**Fix:**
- Change ports in Server settings
- Check firewall rules: `ufw allow 9600/udp`
- Verify AC server path in Settings

### Can't Join Server from Assetto Corsa

**Check:**
- Server status shows "Running"
- Ports are open on firewall
- Server not set to "Public Lobby" (requires registration with Kunos)

**Fix:**
1. Verify server IP address
2. Check UDP port (default: 9600)
3. Disable "Register to Lobby" in Server settings
4. Add firewall rule for UDP port

### Configuration Changes Not Applying

**Solution:**
1. Save the preset
2. Restart the server
3. Configuration files are written to disk on restart

### Track/Car Not Appearing in Lists

**Solution:**
1. Verify content exists in AC server directories:
   - Tracks: `/opt/acserver/content/tracks/`
   - Cars: `/opt/acserver/content/cars/`
2. Click **"Scan Content"** in Settings
3. Refresh browser

For more troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 📚 Advanced Topics

### API Access

The backend exposes a REST API on port 3001:

- `/api/server/status` - Get server status
- `/api/config` - Get/update configuration  
- `/api/content/tracks` - List available tracks
- `/api/content/cars` - List available cars

See [API.md](./API.md) for complete endpoint documentation.

### Command Line Access

**Check server status:**
```bash
pm2 list
```

**View logs:**
```bash
pm2 logs ac-server-manager
```

**Restart app:**
```bash
pm2 restart ac-server-manager
```

### Multiple Server Instances

**Note:** Multi-instance support is planned for a future release. Currently, one server instance per installation.

---

## 🆘 Getting Help

**Documentation:**
- [Installation Guide](./INSTALLATION.md) - Detailed setup instructions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes
- [API Documentation](./API.md) - REST API reference
- [Update System](./UPDATE_SYSTEM.md) - How updates work

**Common Questions:**

**Q: Can I run multiple servers?**  
A: Not yet. Multi-instance support is planned for v1.0.

**Q: Does this work on Windows?**  
A: Yes, for local development. Production deployment recommended on Linux.

**Q: Can I use this without Proxmox?**  
A: Yes. Install on any Linux server with Node.js 18+. See [SERVER_INSTALL.md](./SERVER_INSTALL.md).

**Q: Where are my presets stored?**  
A: `backend/data/presets/` directory. Each preset is a JSON file.

**Q: Can I edit server configs while server is running?**  
A: Yes, but changes only apply after restart.

---

## 📝 Tips & Best Practices

1. **Save presets frequently** - Easy to revert if something breaks
2. **Test locally first** - Use practice session to verify track/car combos work
3. **Start with default settings** - Modify one thing at a time
4. **Check logs** - PM2 logs show AC server output and errors
5. **Backup presets** - Copy `backend/data/presets/` before major changes
6. **Update regularly** - Bug fixes and features added frequently

---

**Last Updated:** December 7, 2025  
**App Version:** 0.28.13  
**License:** MIT

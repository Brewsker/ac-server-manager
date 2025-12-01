# Quick Start Guide

Get AC Server Manager running in 5 minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Assetto Corsa** with dedicated server installed

## Installation

### Option 1: Local Development (Recommended for First Time)

```powershell
# 1. Clone the repository
git clone https://github.com/your-username/ac-server-manager.git
cd ac-server-manager

# 2. Install all dependencies
npm install --prefix backend
npm install --prefix frontend

# 3. Start the application
# Terminal 1:
cd backend
npm run dev

# Terminal 2 (new terminal):
cd frontend
npm run dev
```

**That's it!** Open http://localhost:5173 in your browser.

### First Launch

On first run, you'll see a **Setup Wizard**:

1. Click "Auto-Detect" to find your AC installation
   - OR manually browse to your AC folder (e.g., `C:\Steam\steamapps\common\assettocorsa`)
2. Click "Validate & Save"
3. You're ready to go!

The wizard automatically configures all paths for you. No manual `.env` editing required!

---

## Option 2: Docker Deployment (Production)

Perfect for running on a dedicated server or Proxmox.

### Quick Deploy

```bash
# 1. Clone repository
git clone https://github.com/your-username/ac-server-manager.git
cd ac-server-manager

# 2. Configure AC server path
# Edit docker-compose.yml and change this line:
#   - /path/to/assetto-corsa-server:/ac-server:ro
# To your actual AC installation path

# 3. Build and start
docker-compose up -d

# 4. Check logs
docker-compose logs -f
```

Access at http://your-server-ip:3001

### Complete Setup

See [PROXMOX_DEPLOYMENT.md](./PROXMOX_DEPLOYMENT.md) for detailed instructions including:

- Proxmox LXC container setup
- Nginx reverse proxy
- SSL certificates
- Automatic backups
- Update system

---

## Option 3: One-Line Installer (Windows)

**Coming Soon:** PowerShell script that does everything automatically.

---

## What Gets Configured?

The Setup Wizard finds and configures:

- ✅ AC Server executable (`acServer.exe`)
- ✅ Config file paths (`server_cfg.ini`, `entry_list.ini`)
- ✅ Content directory (tracks, cars, weather)
- ✅ Data storage location (presets, logs)

All settings are saved to `backend/.env` - you can edit this file later if needed.

---

## Troubleshooting

### "Cannot find AC installation"

**Manual paths (edit `backend/.env`):**

```env
AC_SERVER_PATH=C:/Steam/steamapps/common/assettocorsa/server/acServer.exe
AC_CONTENT_PATH=C:/Steam/steamapps/common/assettocorsa/content
```

Replace with your actual Steam library path.

### "Port already in use"

**Kill existing processes:**

```powershell
# Kill all node processes
Get-Process node,nodemon -EA SilentlyContinue | Stop-Process -Force

# Or use the included script
.\stop.ps1
```

### "Module not found"

**Reinstall dependencies:**

```powershell
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd ..\frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### Docker container won't start

**Check logs:**

```bash
docker-compose logs ac-server-manager
```

**Common issues:**

- AC server path not mounted correctly in `docker-compose.yml`
- Port 3001 already in use: `docker-compose down` first

---

## Next Steps

Once running:

1. **Dashboard** - Overview of server status
2. **Server Config** - Customize track, cars, sessions
3. **Entry List** - Manage drivers and AI
4. **Monitoring** - Watch live sessions (coming soon)
5. **Settings** - Check for updates, upload content

---

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🔧 [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- 🚀 [API Reference](./docs/API.md)
- 🐳 [Docker Deployment](./PROXMOX_DEPLOYMENT.md)

---

## For Developers

See [GETTING_STARTED.md](./docs/GETTING_STARTED.md) for:

- Project structure
- Development workflow
- Adding features
- Contributing guidelines

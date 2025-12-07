# AC Server Manager - Installation Guide

Complete installation instructions for all platforms.

---

## 🚀 Quick Install (Proxmox LXC - Recommended)

### One-Command Installation

Run this on your Proxmox host:

```bash
curl -fsSL "https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/scripts/install/install-proxmox-unified.sh" | bash
```

### What It Does

1. Creates Ubuntu 22.04 LXC container (ID 999)
2. Allocates 4GB RAM, 60GB disk, 2 CPU cores
3. Configures static IP: 192.168.1.71/24
4. Injects SSH keys for passwordless access
5. Installs Node.js 20 LTS
6. Downloads and starts setup wizard
7. Opens http://192.168.1.71:3001 for web-based setup

### Custom Installation Options

```bash
# Custom container ID and resources
CONTAINER_ID=100 CONTAINER_RAM=8192 CONTAINER_DISK=100 bash install-proxmox-unified.sh

# Enable debug output
DEBUG=1 bash install-proxmox-unified.sh

# Destroy existing container before installing
DESTROY_EXISTING=1 bash install-proxmox-unified.sh
```

### After Installation

1. Access setup wizard: http://192.168.1.71:3001
2. Choose "Full Installation"
3. Click "Get Started" → "Continue"
4. Wait for installation to complete (~2 minutes)
5. Browser automatically refreshes to main app
6. Start configuring your AC server!

---

## 🖥️ Local Development (Windows/Mac/Linux)

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git ([download](https://git-scm.com/))
- Assetto Corsa with dedicated server files

### Installation Steps

```powershell
# 1. Clone repository
git clone https://github.com/Brewsker/ac-server-manager.git
cd ac-server-manager

# 2. Install dependencies
cd backend
npm install
cd ../frontend
npm install
cd ..

# 3. Start services (two terminals)
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev
```

### Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### First Launch Setup

The setup wizard appears automatically:

1. Click "Auto-Detect" to find AC installation
2. Or manually browse to AC folder (e.g., `C:\Steam\steamapps\common\assettocorsa`)
3. Click "Validate & Save"
4. Configuration saved to `backend/.env`

---

## 🐧 Linux Server Installation

### Automatic Installation

```bash
# Download and run installer
curl -fsSL "https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/scripts/install/install-server.sh" | sudo bash
```

### What Gets Installed

- Node.js 20 LTS
- PM2 process manager
- Git (for updates)
- Build tools (gcc, make)
- 32-bit libraries (for AC server)
- AC Server Manager application

### Installation Options

The installer prompts for:

1. **Installation Type:**

   - Full Installation (Node.js + PM2) - Recommended
   - App Only (assumes Node.js already installed)

2. **AC Server Download:**

   - Yes - Downloads via SteamCMD (requires Steam credentials)
   - No - Use existing installation

3. **Paths Configuration:**
   - AC server installation path
   - Config file locations
   - Content directory

### Post-Installation

```bash
# Check status
pm2 list

# View logs
pm2 logs ac-server-manager

# Restart app
pm2 restart ac-server-manager

# Access app
curl http://localhost:3001
```

---

## 🐳 Docker Installation (Advanced)

### Using Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/Brewsker/ac-server-manager.git
cd ac-server-manager

# 2. Configure AC server path
nano docker-compose.yml
# Edit line:
#   - /path/to/assetto-corsa-server:/ac-server:ro

# 3. Build and start
docker-compose up -d

# 4. Check logs
docker-compose logs -f
```

### Access Application

http://your-server-ip:3001

### Docker Commands

```bash
# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Shell access
docker-compose exec backend sh
```

---

## 🔧 Manual Configuration

If you need to manually configure the application:

### Backend Environment Variables

Create `backend/.env`:

```env
NODE_ENV=production
PORT=3001

# AC Server Paths
AC_SERVER_PATH=/opt/acserver/acServer
AC_SERVER_CONFIG_PATH=/opt/acserver/cfg/server_cfg.ini
AC_ENTRY_LIST_PATH=/opt/acserver/cfg/entry_list.ini
AC_CONTENT_PATH=/opt/acserver/content

# Data Storage
DATA_DIR=./data
PRESETS_DIR=./data/presets
```

### Frontend Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_URL=http://your-server-ip:3001/api
```

### Build Frontend

```bash
cd frontend
npm run build
```

Frontend assets are output to `frontend/dist/`.

---

## 📋 Troubleshooting Installation

### Proxmox Installation Issues

**Container creation fails:**

```bash
# Check available container IDs
pct list

# Manually specify different ID
CONTAINER_ID=100 bash install-proxmox-unified.sh
```

**Wizard not accessible:**

```bash
# Check wizard service
pct exec 999 -- systemctl status ac-setup-wizard

# View logs
pct exec 999 -- journalctl -u ac-setup-wizard -n 50

# Restart wizard
pct exec 999 -- systemctl restart ac-setup-wizard
```

**Installation hangs:**

```bash
# Check installation progress
pct exec 999 -- tail -f /var/log/installer.log

# Check for errors
pct exec 999 -- cat /var/log/ac-setup.log
```

### Linux Server Issues

**Node.js version too old:**

```bash
# Remove old Node.js
sudo apt remove nodejs

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify version
node --version  # Should be v20.x.x
```

**PM2 not found:**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup systemd
sudo systemctl enable pm2-root
```

**Port 3001 already in use:**

```bash
# Find what's using the port
sudo ss -tulpn | grep 3001

# Kill the process (replace PID)
sudo kill -9 <PID>

# Or change port in backend/.env
```

### Local Development Issues

**Dependencies fail to install:**

```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

**Frontend won't connect to backend:**

```powershell
# Check backend is running
curl http://localhost:3001/health

# Verify VITE_API_URL in frontend/.env
# Should be: VITE_API_URL=http://localhost:3001/api
```

---

## 🔄 Post-Installation Steps

### 1. Security Configuration (Production)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow app port
sudo ufw allow 3001/tcp

# Allow AC server ports
sudo ufw allow 9600/udp
sudo ufw allow 8081/tcp
```

### 2. Configure Reverse Proxy (Optional)

Install Nginx for HTTPS:

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/ac-manager

# Add SSL certificate
sudo certbot --nginx -d your-domain.com
```

Example Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable Auto-Updates (Optional)

```bash
# Add cron job to check for updates daily
crontab -e

# Add line:
0 2 * * * cd /opt/ac-server-manager && git pull && npm install && pm2 restart all
```

---

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] Application accessible at http://your-server:3001
- [ ] Version number displays in sidebar
- [ ] Health check returns OK: http://your-server:3001/health
- [ ] Track selection modal loads tracks
- [ ] Car selection modal loads cars
- [ ] Can save and load presets
- [ ] Update checker shows current version
- [ ] PM2 shows app running (Linux/Proxmox)

---

## 📚 Next Steps

- Read the [User Manual](./USER_MANUAL.md) for usage guide
- Configure your first server preset
- Upload custom content (tracks/cars)
- Set up automatic backups
- Join the community for support

---

## 🆘 Need Help?

- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
- [User Manual](./USER_MANUAL.md) - Complete usage guide
- [API Documentation](./API.md) - REST API reference
- [Development Guide](./DEVELOPMENT_PROCEDURE.md) - For contributors

**Last Updated:** December 7, 2025  
**Installer Version:** Unified Installer v2.0

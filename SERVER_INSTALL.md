# Server Installation Guide

Complete guide for deploying AC Server Manager on a dedicated Linux server.

## Quick Install (One Command)

```bash
curl -sSL https://raw.githubusercontent.com/yourusername/ac-server-manager/main/install-server.sh | sudo bash
```

Or download and run:

```bash
wget https://raw.githubusercontent.com/yourusername/ac-server-manager/main/install-server.sh
chmod +x install-server.sh
sudo ./install-server.sh
```

---

## What Gets Installed

The installer handles everything automatically:

### System Packages

- ✅ Node.js 20 LTS
- ✅ Git (for updates)
- ✅ PM2 (process manager) OR Docker + Docker Compose
- ✅ Build tools (gcc, make, etc.)
- ✅ 32-bit libraries (required for AC server)

### Optional Components

- ✅ SteamCMD (if downloading AC server)
- ✅ Assetto Corsa Dedicated Server (via Steam)

### Application

- ✅ AC Server Manager (cloned from GitHub)
- ✅ All dependencies installed
- ✅ Frontend built for production
- ✅ Service configured and started
- ✅ Firewall rules added

---

## Installation Options

The installer presents three choices:

### 1. Full Installation (Recommended)

- Installs Node.js, PM2, and application
- Best for: VPS, dedicated servers, bare metal
- Service: Runs via PM2 with auto-restart
- Memory: ~100MB RAM

### 2. Docker Installation

- Installs Docker, Docker Compose, and runs containerized
- Best for: Proxmox LXC, isolated environments
- Service: Docker container with health checks
- Memory: ~200MB RAM

### 3. App Only

- Assumes Node.js 18+ already installed
- Best for: Shared hosting, custom setups
- You manage: Process startup and monitoring

---

## AC Server Download Options

### Option A: Download via Steam (Automatic)

The installer uses SteamCMD to download AC Dedicated Server:

1. Enter your Steam username
2. Enter your Steam password
3. If Steam Guard enabled, enter the code when prompted

**Security Notes:**

- Credentials are used only during download
- Not stored anywhere
- Script runs locally on your server
- Uses official SteamCMD from Valve

**App ID:** 302550 (AC Dedicated Server)

### Option B: Use Existing Installation

If you already have AC server:

1. Select "No" when asked to download
2. Provide path to existing installation
3. Installer configures paths automatically

### Option C: Manual Download Later

1. Skip AC download during installation
2. Download manually via Steam or copy files
3. Update paths in `backend/.env` file

---

## Installation Flow

Here's what happens step-by-step:

```
1. Welcome Screen
   ↓
2. Choose Installation Type (Full/Docker/App-only)
   ↓
3. AC Server Setup (Download via Steam or use existing)
   ↓
4. Choose Installation Directory
   ↓
5. Confirm Settings
   ↓
6. Install System Packages
   ↓
7. Install Node.js/Docker
   ↓
8. Install SteamCMD (if downloading AC)
   ↓
9. Download AC Server (if selected)
   ↓
10. Clone Application Repository
   ↓
11. Install Dependencies & Build
   ↓
12. Configure Application (.env file)
   ↓
13. Start Service (PM2 or Docker)
   ↓
14. Configure Firewall
   ↓
15. Health Check
   ↓
16. Show Success Message with URLs
```

**Total Time:** 5-15 minutes (depending on internet speed for AC download)

---

## System Requirements

### Minimum

- **OS:** Ubuntu 20.04+ or Debian 11+
- **CPU:** 2 cores
- **RAM:** 2GB
- **Disk:** 10GB free (20GB+ if downloading AC server)
- **Network:** Public IP with ports accessible

### Recommended

- **OS:** Ubuntu 22.04 LTS
- **CPU:** 4 cores
- **RAM:** 4GB
- **Disk:** 50GB SSD
- **Network:** 100Mbps+ connection

### Required Ports

- **3001/TCP** - Web interface
- **9600/TCP** - AC server HTTP API
- **9600/UDP** - AC server game traffic
- **8081/TCP** - AC server TCP traffic

---

## Supported Platforms

### Tested & Supported ✅

- Ubuntu 22.04 LTS
- Ubuntu 20.04 LTS
- Debian 11 (Bullseye)
- Debian 12 (Bookworm)
- Proxmox LXC containers (Ubuntu template)

### Should Work ⚠️

- Ubuntu 24.04 LTS
- Debian 10 (Buster)
- Linux Mint 20+
- Pop!\_OS 22.04+

### Not Supported ❌

- CentOS / RHEL (uses yum instead of apt)
- Alpine Linux (musl libc incompatibility)
- Windows Server (use install.ps1 instead)

---

## Post-Installation

### Access the Application

```bash
# Get your server IP
hostname -I | awk '{print $1}'

# Open in browser
http://YOUR_SERVER_IP:3001
```

### Complete Setup Wizard

1. Browser opens to setup wizard
2. Paths already configured (by installer)
3. Verify and save
4. Start managing servers!

### Service Management

**PM2 Installation:**

```bash
# View status
pm2 status

# View logs
pm2 logs ac-server-manager

# Restart
pm2 restart ac-server-manager

# Stop
pm2 stop ac-server-manager

# Start
pm2 start ac-server-manager
```

**Docker Installation:**

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Start
docker-compose up -d
```

### Update the Application

Built-in update system via web UI:

1. Go to Settings page
2. Click "Check for Updates"
3. Click "Install Update"
4. Confirm in modal
5. Wait for automatic restart

Or via command line:

```bash
cd /opt/ac-server-manager
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart ac-server-manager
```

---

## Troubleshooting

### Installation Fails

**Check logs:**

```bash
# The installer outputs detailed error messages
# Scroll up to see what failed
```

**Common issues:**

1. **"Not running as root"**

   ```bash
   sudo ./install-server.sh
   ```

2. **"Node.js installation failed"**

   ```bash
   # Install manually then re-run
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
   sudo apt-get install -y nodejs
   ```

3. **"Steam login failed"**
   - Check username/password
   - Enter Steam Guard code when prompted
   - Try again with `./install-server.sh`

### Application Won't Start

**Check service status:**

PM2:

```bash
pm2 status
pm2 logs ac-server-manager --lines 50
```

Docker:

```bash
docker-compose ps
docker-compose logs --tail=50
```

**Common fixes:**

1. **Port already in use:**

   ```bash
   sudo lsof -i :3001
   sudo kill <PID>
   pm2 restart ac-server-manager
   ```

2. **Missing dependencies:**

   ```bash
   cd /opt/ac-server-manager/backend
   npm install
   pm2 restart ac-server-manager
   ```

3. **Permission issues:**
   ```bash
   sudo chown -R root:root /opt/ac-server-manager
   sudo chmod -R 755 /opt/ac-server-manager
   ```

### Can't Access Web Interface

**Check firewall:**

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 3001/tcp

# Show listening ports
sudo netstat -tlnp | grep 3001
```

**Check from server:**

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Check from remote:**

```bash
# From your computer
curl http://SERVER_IP:3001/health
```

If localhost works but remote doesn't:

- Firewall blocking port 3001
- Cloud provider security group blocking port
- ISP blocking port (try different port)

### AC Server Won't Start

**Check AC installation:**

```bash
/opt/assetto-corsa-server/acServer -v
# Should show version number
```

**Check paths in .env:**

```bash
cat /opt/ac-server-manager/backend/.env | grep AC_
```

**Test manual start:**

```bash
cd /opt/assetto-corsa-server
./acServer
# Should start server, Ctrl+C to stop
```

---

## Advanced Configuration

### Change Installation Directory

Edit the script before running:

```bash
# Download script
wget https://raw.githubusercontent.com/.../install-server.sh

# Edit
nano install-server.sh

# Find and change:
APP_DIR="/opt/ac-server-manager"
AC_SERVER_DIR="/opt/assetto-corsa-server"

# Save and run
sudo ./install-server.sh
```

### Use Different Node.js Version

```bash
# Edit script
NODE_VERSION="18"  # or 20, 21, etc.
```

### Run on Custom Port

After installation, edit `.env`:

```bash
nano /opt/ac-server-manager/backend/.env

# Change:
PORT=8080

# Restart
pm2 restart ac-server-manager

# Update firewall
sudo ufw allow 8080/tcp
```

### Enable HTTPS with Nginx

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Create site config
sudo nano /etc/nginx/sites-available/ac-manager

# Add:
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

# Enable site
sudo ln -s /etc/nginx/sites-available/ac-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Setup Automatic Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-ac-manager.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/ac-manager"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /opt/ac-server-manager/backend/data

# Backup AC server configs
tar -czf $BACKUP_DIR/ac-server_$DATE.tar.gz /opt/assetto-corsa-server/cfg

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup complete: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-ac-manager.sh

# Add to cron (daily at 3 AM)
sudo crontab -e

# Add line:
0 3 * * * /usr/local/bin/backup-ac-manager.sh >> /var/log/ac-manager-backup.log 2>&1
```

---

## Uninstallation

To completely remove AC Server Manager:

```bash
# Stop service
pm2 delete ac-server-manager
# OR
docker-compose down

# Remove application
sudo rm -rf /opt/ac-server-manager

# Remove AC server (optional)
sudo rm -rf /opt/assetto-corsa-server

# Remove PM2 (if not used elsewhere)
npm uninstall -g pm2

# Remove Docker (if not used elsewhere)
sudo apt remove docker docker-compose
```

---

## Security Considerations

### Production Deployment Checklist

- [ ] Change default ports (not 3001)
- [ ] Enable firewall (ufw)
- [ ] Use HTTPS (Nginx + Let's Encrypt)
- [ ] Set strong passwords for AC server
- [ ] Disable root SSH login
- [ ] Enable automatic security updates
- [ ] Setup fail2ban
- [ ] Regular backups enabled
- [ ] Monitor logs regularly
- [ ] Keep system and app updated

### Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow web interface
sudo ufw allow 3001/tcp

# Allow AC server
sudo ufw allow 9600/tcp
sudo ufw allow 9600/udp
sudo ufw allow 8081/tcp

# Check status
sudo ufw status
```

---

## Support

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/yourusername/ac-server-manager/issues)
- 💬 [Discord Community](#)
- 📧 [Email Support](#)

---

## License

MIT License - See [LICENSE](./LICENSE) file

# 🎯 Quick Command Reference

Copy-paste these commands to deploy AC Server Manager.

---

## Proxmox (Automated - Creates Everything)

**Run on Proxmox HOST:**

```bash
curl -sSL https://raw.githubusercontent.com/brooksmtownsend/ac-server-manager/multi-instance-manager/install-proxmox.sh | bash
```

**What it does:**

- ✅ Creates Ubuntu 22.04 LXC container
- ✅ Configures resources (2 CPU, 2GB RAM, 20GB disk)
- ✅ Installs Docker or PM2 (you choose)
- ✅ Installs AC Server Manager
- ✅ Optionally downloads AC via SteamCMD
- ✅ Configures firewall
- ✅ Auto-starts on boot

**Time:** ~10-15 minutes

**Access:** `http://CONTAINER_IP:3001`

---

## Linux Server (Ubuntu/Debian)

**Run inside your server:**

```bash
curl -sSL https://raw.githubusercontent.com/brooksmtownsend/ac-server-manager/multi-instance-manager/install-server.sh | sudo bash
```

**What it does:**

- ✅ Installs Node.js 20 or Docker
- ✅ Installs PM2 process manager
- ✅ Optionally downloads AC via SteamCMD
- ✅ Installs and configures app
- ✅ Starts service

**Time:** ~10 minutes

**Access:** `http://YOUR_SERVER_IP:3001`

---

## Windows (Local Development)

**Run in PowerShell:**

```powershell
.\install.ps1
```

**What it does:**

- ✅ Checks Node.js installed
- ✅ Installs dependencies
- ✅ Starts backend + frontend
- ✅ Opens browser

**Time:** ~3 minutes

**Access:** `http://localhost:5173`

---

## Manual Docker

**If you already have Docker:**

```bash
# Clone repo
git clone https://github.com/brooksmtownsend/ac-server-manager.git
cd ac-server-manager

# Edit docker-compose.yml (set AC server path)
nano docker-compose.yml

# Start
docker-compose up -d
```

---

## After Installation

### Check Status

**Proxmox:**

```bash
pct list | grep ac-manager
pct enter <CONTAINER_ID>
```

**Inside container (Docker):**

```bash
docker-compose ps
docker-compose logs -f
```

**Inside container (PM2):**

```bash
pm2 status
pm2 logs ac-server-manager
```

### Access Web UI

Open browser to:

- Proxmox: `http://CONTAINER_IP:3001`
- Linux: `http://SERVER_IP:3001`
- Windows: `http://localhost:5173`

### Manage Service

**Docker:**

```bash
docker-compose restart
docker-compose stop
docker-compose start
docker-compose logs -f
```

**PM2:**

```bash
pm2 restart ac-server-manager
pm2 stop ac-server-manager
pm2 start ac-server-manager
pm2 logs ac-server-manager
```

### Update Application

**Via Web UI:**

1. Go to Settings
2. Click "Check for Updates"
3. Click "Install Update"
4. Confirm

**Via Command Line:**

```bash
cd /opt/ac-server-manager
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart ac-server-manager  # or docker-compose restart
```

---

## Troubleshooting

### Can't Access Web UI

```bash
# Check if service running
pm2 status  # or docker-compose ps

# Check firewall
ufw status
ufw allow 3001/tcp

# Check from inside server
curl http://localhost:3001/health
```

### Container Not Starting (Proxmox)

```bash
# Check container status
pct status <CONTAINER_ID>

# View logs
pct exec <CONTAINER_ID> -- journalctl -xe

# Restart container
pct stop <CONTAINER_ID>
pct start <CONTAINER_ID>
```

### AC Server Won't Start

```bash
# Check AC installation
ls -la /opt/assetto-corsa-server/acServer

# Check paths in .env
cat /opt/ac-server-manager/backend/.env | grep AC_

# Test manual start
cd /opt/assetto-corsa-server
./acServer
```

---

## Common Port Forwarding (Proxmox)

If you want to access from outside Proxmox:

```bash
# On Proxmox HOST, add port forward rule
# Edit /etc/pve/firewall/cluster.fw

[RULES]
IN ACCEPT -p tcp -dport 3001 -dest <CONTAINER_IP>

# Or use iptables
iptables -t nat -A PREROUTING -p tcp --dport 3001 -j DNAT --to <CONTAINER_IP>:3001
iptables -t nat -A POSTROUTING -j MASQUERADE
```

---

## Quick Uninstall

**Proxmox:**

```bash
pct stop <CONTAINER_ID>
pct destroy <CONTAINER_ID>
```

**Linux Server:**

```bash
pm2 delete ac-server-manager
rm -rf /opt/ac-server-manager
rm -rf /opt/assetto-corsa-server
```

**Docker:**

```bash
docker-compose down -v
rm -rf /opt/ac-server-manager
```

---

## Support Links

- 📖 [Full Documentation](./README.md)
- 🖥️ [Server Install Guide](./SERVER_INSTALL.md)
- 🐳 [Proxmox Guide](./PROXMOX_DEPLOYMENT.md)
- 🔧 [Troubleshooting](./docs/TROUBLESHOOTING.md)
- 🐛 [Report Issues](https://github.com/brooksmtownsend/ac-server-manager/issues)

---

**Last Updated:** December 1, 2025

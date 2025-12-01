# Proxmox LXC Deployment Guide

## Quick Setup on Proxmox

### 1. Create LXC Container

In Proxmox web interface:

1. **Create Container**

   - Template: Ubuntu 22.04
   - Storage: 20GB (minimum)
   - CPU: 2 cores
   - RAM: 2048 MB
   - Network: Bridge to your network

2. **Container Settings**
   - Features: Enable "Nesting" and "keyctl"
   - Options: Start at boot enabled

### 2. Initial Container Setup

```bash
# Enter container
pct enter <container-id>

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Install git
apt install -y git
```

### 3. Clone Repository

```bash
# Create app directory
mkdir -p /opt/ac-server-manager
cd /opt/ac-server-manager

# Clone repository
git clone https://github.com/your-username/ac-server-manager.git .

# Or upload via SCP from your dev machine
# scp -r "C:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager\*" root@container-ip:/opt/ac-server-manager/
```

### 4. Configure Environment

```bash
cd /opt/ac-server-manager

# Update docker-compose.yml
nano docker-compose.yml
```

Update the AC server path:

```yaml
volumes:
  - /path/to/your/ac-server:/ac-server:ro
```

**Create .env file:**

```bash
nano .env
```

```env
NODE_ENV=production
PORT=3001
AC_SERVER_PATH=/ac-server
```

### 5. Build and Start

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### 6. Access the Application

- Frontend: `http://container-ip:80`
- Backend API: `http://container-ip:3001`

## Updating via Web Interface

The application includes a built-in update system that works in Docker:

1. Go to **Settings** page
2. Click **"Check for Updates"**
3. If updates available, click **"Update & Restart"**
4. System will:
   - Pull latest code from git
   - Rebuild container
   - Restart services
   - Preserve all data

## Manual Update Process

```bash
cd /opt/ac-server-manager

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Backup Strategy

**Automated backup script:**

```bash
nano /opt/backup-ac-manager.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup data volume
docker run --rm \
  -v ac-server-manager_ac-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/ac-data-$DATE.tar.gz /data

# Keep only last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

**Add to crontab:**

```bash
chmod +x /opt/backup-ac-manager.sh
crontab -e
```

```
0 2 * * * /opt/backup-ac-manager.sh >> /var/log/ac-backup.log 2>&1
```

## Monitoring

```bash
# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f ac-server-manager

# Resource usage
docker stats

# Container status
docker-compose ps
```

## Troubleshooting

**Container won't start:**

```bash
docker-compose logs ac-server-manager
```

**Update failed:**

```bash
# Check git status
cd /opt/ac-server-manager
git status
git pull --rebase

# Force rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Data persistence issues:**

```bash
# Check volumes
docker volume ls
docker volume inspect ac-server-manager_ac-data
```

## Proxmox-Specific Features

**Container Snapshots:**

```bash
# From Proxmox host
pct snapshot <container-id> pre-update --description "Before update"
```

**Resource Limits:**

```bash
# Adjust in Proxmox UI or via CLI
pct set <container-id> --memory 4096 --cores 4
```

**Network Configuration:**

```bash
# Static IP in Proxmox UI
# Or manually in container
nano /etc/network/interfaces
```

## Performance Tuning

**For production use:**

Edit `docker-compose.yml`:

```yaml
services:
  ac-server-manager:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Security Considerations

1. **Firewall Rules** (on Proxmox host):

```bash
# Allow only necessary ports
iptables -A FORWARD -i vmbr0 -o vmbr0 -p tcp --dport 80 -j ACCEPT
iptables -A FORWARD -i vmbr0 -o vmbr0 -p tcp --dport 443 -j ACCEPT
```

2. **SSL/TLS** - Update nginx config with SSL certificates

3. **Container isolation** - LXC provides good isolation by default

4. **Regular updates** - Use the web interface to stay current

---

**Quick Reference Commands:**

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Update
git pull && docker-compose up -d --build

# Logs
docker-compose logs -f

# Backup
docker run --rm -v ac-server-manager_ac-data:/data -v /backup:/backup alpine tar czf /backup/backup.tar.gz /data
```

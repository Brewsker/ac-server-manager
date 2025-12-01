# Deployment Guide - AC Server Manager

This guide covers deploying the AC Server Manager to a production environment for live testing.

## Prerequisites

- Ubuntu/Debian Linux server (or Windows Server)
- Node.js 18+ installed
- Assetto Corsa Dedicated Server installed
- Domain name (optional, for SSL)
- Firewall access to required ports

## Quick Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install git (if needed)
sudo apt install -y git
```

### 2. Clone/Upload Project

**Option A: From Git**

```bash
cd /opt
sudo git clone <your-repo-url> ac-server-manager
cd ac-server-manager
```

**Option B: Upload via SCP**

```bash
# From your local machine
scp -r "C:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager" user@server:/opt/ac-server-manager
```

### 3. Install Dependencies

```bash
cd /opt/ac-server-manager

# Backend
cd backend
npm install --production
cd ..

# Frontend (build for production)
cd frontend
npm install
npm run build
cd ..
```

### 4. Configuration

**Create production environment file:**

```bash
cd /opt/ac-server-manager/backend
nano .env
```

Add:

```env
NODE_ENV=production
PORT=3001
AC_SERVER_PATH=/path/to/assetto-corsa-server
```

**Update frontend API endpoint:**

```bash
cd /opt/ac-server-manager/frontend
nano .env.production
```

Add:

```env
VITE_API_URL=http://your-server-ip:3001/api
```

Rebuild frontend:

```bash
npm run build
```

### 5. Setup PM2 Process Manager

**Create PM2 ecosystem file:**

```bash
cd /opt/ac-server-manager
nano ecosystem.config.cjs
```

```javascript
module.exports = {
  apps: [
    {
      name: 'ac-manager-backend',
      script: './backend/src/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

**Start with PM2:**

```bash
# Create logs directory
mkdir -p logs

# Start the backend
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

### 6. Setup Nginx (Recommended)

**Install Nginx:**

```bash
sudo apt install -y nginx
```

**Create Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/ac-manager
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or server IP

    # Frontend (static files)
    location / {
        root /opt/ac-server-manager/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Increase timeouts for file uploads
        client_max_body_size 50M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/ac-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow AC Server ports (if running on same server)
sudo ufw allow 9600/tcp  # HTTP
sudo ufw allow 9600/udp  # UDP
sudo ufw allow 8081/tcp  # TCP

# Enable firewall
sudo ufw enable
```

### 8. SSL Certificate (Optional but Recommended)

**Using Certbot (Let's Encrypt):**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Testing the Deployment

1. **Check Backend Status:**

```bash
pm2 status
pm2 logs ac-manager-backend
```

2. **Test Backend API:**

```bash
curl http://localhost:3001/health
```

3. **Access Frontend:**

```
http://your-server-ip
# or
https://your-domain.com
```

## Using the Auto-Update Feature

Once deployed, you can update the application using the built-in update system:

1. **From the Web Interface:**

   - Go to Settings page
   - Click "Check for Updates"
   - If updates available, click "Install Update"
   - System will pull latest changes and restart

2. **Manual Update:**

```bash
cd /opt/ac-server-manager
git pull origin main

# Backend
cd backend
npm install
pm2 restart ac-manager-backend

# Frontend (if changes)
cd ../frontend
npm install
npm run build
```

## Maintenance Commands

```bash
# View logs
pm2 logs ac-manager-backend

# Restart backend
pm2 restart ac-manager-backend

# Stop backend
pm2 stop ac-manager-backend

# Monitor resources
pm2 monit

# Clear logs
pm2 flush

# View all PM2 processes
pm2 list
```

## Backup Strategy

**Automated backup script:**

```bash
sudo nano /opt/backup-ac-manager.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/ac-manager"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup presets and configs
tar -czf "$BACKUP_DIR/ac-manager-data-$DATE.tar.gz" \
    /opt/ac-server-manager/backend/data

# Keep only last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Make executable and add to crontab:**

```bash
sudo chmod +x /opt/backup-ac-manager.sh
crontab -e
```

Add daily backup at 2 AM:

```
0 2 * * * /opt/backup-ac-manager.sh >> /var/log/ac-manager-backup.log 2>&1
```

## Troubleshooting

**Backend won't start:**

```bash
pm2 logs ac-manager-backend --lines 100
```

**Frontend not loading:**

- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify build files exist: `ls -la /opt/ac-server-manager/frontend/dist`

**AC Server not detected:**

- Verify AC_SERVER_PATH in `.env`
- Check file permissions: `ls -la $AC_SERVER_PATH`

**Can't upload CM packs:**

- Check nginx client_max_body_size
- Verify backend body parser limit (should be 50mb)

## Security Recommendations

1. **Change default ports** if exposed to internet
2. **Use SSL/HTTPS** in production
3. **Setup firewall rules** to restrict access
4. **Regular backups** of presets and configs
5. **Keep Node.js updated**: `sudo npm install -g n && sudo n stable`
6. **Monitor logs** for suspicious activity
7. **Use strong passwords** for admin access (when implemented)

## Performance Tuning

**For multiple server instances:**

```javascript
// In ecosystem.config.cjs
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

**Nginx caching for static assets:**

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Monitoring

**Setup PM2 monitoring (optional):**

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Support & Updates

- Check for updates regularly via the web interface
- Review CHANGELOG.md for version changes
- Join community Discord/forum for support (if available)
- Report issues on GitHub

---

**Next Steps After Deployment:**

1. Test all features with real AC server
2. Import your existing CM presets
3. Configure multiple server instances
4. Setup automated backups
5. Monitor performance and logs

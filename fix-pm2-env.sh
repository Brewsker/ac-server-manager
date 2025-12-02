#!/bin/bash
###############################################################################
# Quick fix: Update PM2 to use ecosystem config with NODE_ENV=production
###############################################################################

set -e

echo "🔄 Updating git-cache..."
pct exec 998 -- bash -c "cd /opt/git-cache/ac-server-manager && git fetch origin develop && git reset --hard origin/develop"

echo "📦 Copying ecosystem.config.js to container..."
pct push 999 /opt/git-cache/ac-server-manager/backend/ecosystem.config.js /opt/ac-server-manager/backend/ecosystem.config.js

echo "🔄 Restarting PM2 with ecosystem config..."
pct exec 999 -- bash -c "cd /opt/ac-server-manager/backend && pm2 delete ac-server-manager || true"
pct exec 999 -- bash -c "cd /opt/ac-server-manager/backend && pm2 start ecosystem.config.js"
pct exec 999 -- bash -c "pm2 save"

echo "✅ Checking PM2 status..."
pct exec 999 -- pm2 list

echo ""
echo "🎯 Done! Check environment with:"
echo "   pct exec 999 -- pm2 show ac-server-manager"
echo ""
echo "🌐 Access app at: http://192.168.1.71:3001"

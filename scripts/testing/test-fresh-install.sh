#!/bin/bash
###############################################################################
# Quick Test - Fresh Install of AC Server Manager
###############################################################################

set -e

echo "🧹 Cleaning up existing containers..."
pct stop 999 &>/dev/null || true
pct destroy 999 &>/dev/null || true

echo "🔄 Syncing git-cache..."
pct exec 998 -- bash -c "cd /opt/git-cache/ac-server-manager && git fetch origin develop && git reset --hard origin/develop && git log -1 --oneline"

echo "🚀 Running unified installer..."
curl -fsSL "http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh" | bash

echo ""
echo "✅ Installation complete!"
echo ""
echo "📊 Checking status..."
pct list | grep -E "VMID|999"
echo ""
pct exec 999 -- pm2 list

echo ""
echo "🔑 Testing SSH access..."
ssh -o StrictHostKeyChecking=accept-new root@192.168.1.71 "hostname && pm2 list"

echo ""
echo "🌐 Access the app at: http://192.168.1.71:3001"

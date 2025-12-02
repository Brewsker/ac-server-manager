#!/bin/bash
###############################################################################
# Update Setup Wizard - Manual Update Script
# 
# Run this on Proxmox host to update the wizard to latest code
# Usage: bash update-wizard.sh
###############################################################################

set -e

GIT_CACHE_CTID=998
AC_TEST_CTID=999

echo "🔄 Updating Setup Wizard..."
echo ""

# Step 1: Sync git-cache from GitHub
echo "▶ Syncing git-cache from GitHub..."
pct exec $GIT_CACHE_CTID -- bash -c "cd /opt/git-cache/ac-server-manager && git fetch origin develop && git reset --hard origin/develop"
LATEST_COMMIT=$(pct exec $GIT_CACHE_CTID -- bash -c "cd /opt/git-cache/ac-server-manager && git log -1 --oneline")
echo "✅ Git-cache synced: $LATEST_COMMIT"
echo ""

# Step 2: Download latest wizard files to ac-test container
echo "▶ Updating wizard files in container $AC_TEST_CTID..."
pct exec $AC_TEST_CTID -- bash -c "curl -fsSL http://192.168.1.70/ac-server-manager/setup-wizard.html -o /opt/ac-setup/setup-wizard.html"
echo "✅ setup-wizard.html updated"

pct exec $AC_TEST_CTID -- bash -c "curl -fsSL http://192.168.1.70/ac-server-manager/setup-server.js -o /opt/ac-setup/setup-server.js"
echo "✅ setup-server.js updated"
echo ""

# Step 3: Restart wizard service
echo "▶ Restarting wizard service..."
pct exec $AC_TEST_CTID -- systemctl restart ac-setup-wizard
echo "✅ Wizard service restarted"
echo ""

echo "🎉 Setup wizard updated successfully!"
echo "📍 Access at: http://192.168.1.71:3001"
echo ""
echo "💡 Hard refresh your browser (Ctrl+Shift+R) to see changes"

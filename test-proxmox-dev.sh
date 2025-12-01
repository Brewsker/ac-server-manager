#!/bin/bash
#
# AC Server Manager - Proxmox Development Container Manager
# Uses local Git clone instead of downloading from GitHub
#
# Usage: ./test-proxmox-dev.sh {create|destroy|rebuild|enter|sync}
#

set -e

# Configuration
CTID=999
HOSTNAME="ac-test"
STORAGE="local-lvm"
TEMPLATE="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
PASSWORD="TestPass123"
BRIDGE="vmbr0"
DISK_SIZE="60"
MEMORY=4096
SWAP=512

# Git cache container settings
GIT_CACHE_CTID=998
GIT_CACHE_PATH="/opt/git-cache/ac-server-manager"
BRANCH="develop"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Sync from Git cache container
sync_repo() {
    if ! pct status $GIT_CACHE_CTID &>/dev/null; then
        print_error "Git cache container (ID $GIT_CACHE_CTID) not found!"
        print_info "Create it first with: ./git-cache-server.sh create"
        exit 1
    fi
    
    print_info "Syncing from Git cache container..."
    pct exec $GIT_CACHE_CTID -- bash -c "cd $GIT_CACHE_PATH && git fetch --all --prune && git checkout $BRANCH && git pull origin $BRANCH"
    print_success "Repository synced to latest $BRANCH"
}

# Copy files from Git cache container
copy_files_from_cache() {
    local temp_dir="/tmp/ac-setup-$$"
    
    print_info "Copying files from Git cache container..."
    
    # Create temp directory
    mkdir -p "$temp_dir"
    
    # Copy files from git cache container to Proxmox host
    pct pull $GIT_CACHE_CTID "$GIT_CACHE_PATH/setup-wizard.html" "$temp_dir/setup-wizard.html"
    pct pull $GIT_CACHE_CTID "$GIT_CACHE_PATH/setup-server.js" "$temp_dir/setup-server.js"
    pct pull $GIT_CACHE_CTID "$GIT_CACHE_PATH/ac-setup-wizard.service" "$temp_dir/ac-setup-wizard.service"
    
    # Push files to target container
    pct push $CTID "$temp_dir/setup-wizard.html" /opt/ac-setup/setup-wizard.html
    pct push $CTID "$temp_dir/setup-server.js" /opt/ac-setup/setup-server.js
    pct push $CTID "$temp_dir/ac-setup-wizard.service" /etc/systemd/system/ac-setup-wizard.service
    
    # Cleanup
    rm -rf "$temp_dir"
    
    print_success "Files copied from cache"
}

# Create container
create_container() {
    print_info "Creating test container $CTID..."
    
    # Create container
    pct create $CTID $TEMPLATE \
        --hostname $HOSTNAME \
        --password $PASSWORD \
        --storage $STORAGE \
        --rootfs $STORAGE:$DISK_SIZE \
        --memory $MEMORY \
        --swap $SWAP \
        --net0 name=eth0,bridge=$BRIDGE,ip=dhcp \
        --features nesting=1 \
        --unprivileged 1 \
        --onboot 0 \
        --start 1
    
    print_success "Container created and started"
    
    # Wait for network
    sleep 5
    
    # Install bootstrap packages
    print_info "Installing bootstrap packages (curl, Node.js)..."
    pct exec $CTID -- bash -c "apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
    print_success "Bootstrap packages installed"
    
    # Get container IP
    CONTAINER_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')
    print_success "Container IP: $CONTAINER_IP"
    
    # Copy wizard files from Git cache container
    print_info "Setting up web-based installation wizard from cache..."
    pct exec $CTID -- bash -c "mkdir -p /opt/ac-setup"
    copy_files_from_cache
    
    # Start setup wizard service
    print_info "Starting setup wizard service..."
    pct exec $CTID -- bash -c "systemctl daemon-reload && systemctl start ac-setup-wizard && systemctl is-active ac-setup-wizard"
    sleep 2
    
    print_success "Setup wizard ready!"
    echo ""
    print_info "Open http://$CONTAINER_IP:3001 in your browser to complete installation"
    echo ""
    print_info "Container Details:"
    echo "  ID:       $CTID"
    echo "  Hostname: $HOSTNAME"
    echo "  IP:       $CONTAINER_IP"
    echo "  Password: $PASSWORD"
    echo ""
    print_info "Enter container with: pct enter $CTID"
    print_info "Or use: $0 enter"
}

# Destroy container
destroy_container() {
    print_info "Destroying test container $CTID..."
    
    if pct status $CTID &>/dev/null; then
        print_info "Stopping container..."
        pct stop $CTID || true
        sleep 2
        pct destroy $CTID --purge 1
        print_success "Container destroyed"
    else
        print_info "Container does not exist"
    fi
}

# Rebuild container
rebuild_container() {
    print_info "Rebuilding test container..."
    echo ""
    destroy_container
    echo ""
    sync_repo
    echo ""
    create_container
}

# Enter container
enter_container() {
    if pct status $CTID &>/dev/null; then
        pct enter $CTID
    else
        print_error "Container $CTID does not exist"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Proxmox Development Test Container Manager"
    echo ""
    echo "Usage: $0 {create|destroy|rebuild|enter|sync}"
    echo ""
    echo "Commands:"
    echo "  create   - Create new test container (ID $CTID)"
    echo "  destroy  - Destroy test container"
    echo "  rebuild  - Destroy and recreate (quick reset)"
    echo "  enter    - Enter container shell"
    echo "  sync     - Sync Git cache container with GitHub"
    echo ""
    echo "Prerequisites:"
    echo "  Git cache container (ID $GIT_CACHE_CTID) must be running"
    echo "  Create with: ./git-cache-server.sh create"
    echo ""
    
    if pct status $CTID &>/dev/null; then
        echo "Current container ID: $CTID"
        echo "Status: $(pct status $CTID)"
        CONTAINER_IP=$(pct exec $CTID -- hostname -I 2>/dev/null | awk '{print $1}' || echo "N/A")
        echo "IP: $CONTAINER_IP"
    else
        echo "Current container ID: $CTID"
        echo "Status: Not created"
    fi
}

# Main
case "${1:-}" in
    create)
        sync_repo
        create_container
        ;;
    destroy)
        destroy_container
        ;;
    rebuild)
        rebuild_container
        ;;
    enter)
        enter_container
        ;;
    sync)
        sync_repo
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

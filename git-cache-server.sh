#!/bin/bash
#
# AC Server Manager - Git Cache Server (Proxmox Container)
# Persistent Git repository cache to speed up development
#
# Usage: ./git-cache-server.sh {create|destroy|sync|enter|status}
#

set -e

# Configuration
CTID=998
HOSTNAME="git-cache"
STORAGE="local-lvm"
TEMPLATE="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
PASSWORD="GitCache123"
BRIDGE="vmbr0"
DISK_SIZE="10"
MEMORY=512
SWAP=256

# Git repo settings
GIT_REPO_URL="https://github.com/Brewsker/ac-server-manager.git"
GIT_REPO_PATH="/opt/git-cache/ac-server-manager"
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

# Create Git cache container
create_container() {
    if pct status $CTID &>/dev/null; then
        print_error "Git cache container already exists (ID: $CTID)"
        exit 1
    fi
    
    print_info "Creating Git cache container $CTID..."
    
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
        --onboot 1 \
        --start 1
    
    print_success "Container created and started"
    sleep 5
    
    # Install git and nginx
    print_info "Installing git and nginx..."
    pct exec $CTID -- bash -c "apt-get update && apt-get install -y git nginx-light"
    
    # Clone repository
    print_info "Cloning repository..."
    pct exec $CTID -- bash -c "mkdir -p /opt/git-cache && cd /opt/git-cache && git clone --mirror $GIT_REPO_URL"
    
    # Configure nginx to serve git repo
    print_info "Configuring nginx..."
    pct exec $CTID -- bash -c 'cat > /etc/nginx/sites-available/git-cache <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        root /opt/git-cache;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
    }
}
EOF'
    
    pct exec $CTID -- bash -c "ln -sf /etc/nginx/sites-available/git-cache /etc/nginx/sites-enabled/default"
    pct exec $CTID -- bash -c "systemctl restart nginx"
    
    # Get IP
    CONTAINER_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')
    
    print_success "Git cache server ready!"
    echo ""
    print_info "Container Details:"
    echo "  ID:       $CTID"
    echo "  Hostname: $HOSTNAME"
    echo "  IP:       $CONTAINER_IP"
    echo "  Password: $PASSWORD"
    echo ""
    print_info "Repository cached at: http://$CONTAINER_IP/"
    echo ""
    print_success "Use 'sync' command to update cache from GitHub"
}

# Destroy container
destroy_container() {
    if ! pct status $CTID &>/dev/null; then
        print_error "Git cache container does not exist"
        exit 1
    fi
    
    print_info "Destroying Git cache container $CTID..."
    pct stop $CTID || true
    sleep 2
    pct destroy $CTID --purge 1
    print_success "Container destroyed"
}

# Sync repository
sync_repo() {
    if ! pct status $CTID &>/dev/null; then
        print_error "Git cache container does not exist. Create it first."
        exit 1
    fi
    
    print_info "Syncing repository from GitHub..."
    pct exec $CTID -- bash -c "cd $GIT_REPO_PATH && git fetch --all --prune"
    print_success "Repository synced!"
}

# Enter container
enter_container() {
    if ! pct status $CTID &>/dev/null; then
        print_error "Git cache container does not exist"
        exit 1
    fi
    pct enter $CTID
}

# Show status
show_status() {
    if pct status $CTID &>/dev/null; then
        CONTAINER_IP=$(pct exec $CTID -- hostname -I 2>/dev/null | awk '{print $1}' || echo "N/A")
        echo "Git Cache Server Status:"
        echo "  Container ID: $CTID"
        echo "  Status: $(pct status $CTID)"
        echo "  IP: $CONTAINER_IP"
        echo "  URL: http://$CONTAINER_IP/"
        echo ""
        print_info "Repository location: $GIT_REPO_PATH"
    else
        echo "Git Cache Server Status: Not created"
    fi
}

# Show usage
show_usage() {
    echo "Git Cache Server Manager"
    echo ""
    echo "Usage: $0 {create|destroy|sync|enter|status}"
    echo ""
    echo "Commands:"
    echo "  create  - Create Git cache container (ID $CTID)"
    echo "  destroy - Destroy Git cache container"
    echo "  sync    - Update cache from GitHub"
    echo "  enter   - Enter container shell"
    echo "  status  - Show container status"
    echo ""
    show_status
}

# Main
case "${1:-}" in
    create)
        create_container
        ;;
    destroy)
        destroy_container
        ;;
    sync)
        sync_repo
        ;;
    enter)
        enter_container
        ;;
    status)
        show_status
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

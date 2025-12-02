#!/bin/bash
###############################################################################
# AC Server Manager - Unified Proxmox Installer (Development/Testing Version)
# 
# This script creates a Proxmox LXC container, deploys a web-based setup wizard,
# and handles the complete installation process.
#
# Usage (on Proxmox host):
#   curl -fsSL "https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/install-proxmox-unified.sh?$(date +%s)" | bash
#   OR
#   ./install-proxmox-unified.sh [options]
#
# Options:
#   --ctid <id>        Container ID (default: 999)
#   --hostname <name>  Container hostname (default: ac-server)
#   --memory <MB>      Memory in MB (default: 4096)
#   --disk <GB>        Disk size in GB (default: 60)
#   --cores <n>        CPU cores (default: 2)
#   --storage <name>   Storage pool (default: local-lvm)
#   --template <path>  LXC template (default: ubuntu-22.04)
#   --password <pwd>   Root password (default: auto-generated)
#   --keep-existing    Keep existing container (default: auto-replace)
#   --debug            Enable verbose debugging
#
###############################################################################

set -e  # Exit on error
set -o pipefail  # Pipe failures propagate

# Script version
VERSION="1.0.0-dev"

# Git-cache container version (increment when nginx config or setup changes)
GIT_CACHE_VERSION="2"

# Script checksum for verification (updated: 2025-12-01 19:54)
SCRIPT_DATE="2025-12-01-1954"
SCRIPT_NAME="AC Server Manager - Unified Installer"

# Development vs Production mode
# In dev mode: Always destroy existing containers for clean testing
# In production: Ask user what to do with existing containers
if [[ "$VERSION" == *"-dev"* ]]; then
    DEV_MODE=true
    DESTROY_EXISTING=true  # Always clean slate in dev mode
else
    DEV_MODE=false
    DESTROY_EXISTING=false  # Ask user in production
fi

# Default configuration
CTID=999
HOSTNAME="ac-server"
PASSWORD=""
CORES=2
MEMORY=4096
DISK=60
STORAGE="local-lvm"
TEMPLATE="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
DEBUG=false

# Network configuration (static for development)
NETWORK_MODE="static"  # static or dhcp
STATIC_IP="192.168.1.71/24"
GATEWAY="192.168.1.1"
BRIDGE="vmbr0"

# Application settings
WIZARD_PORT=3001
SETUP_DIR="/opt/ac-setup"
APP_DIR="/opt/ac-server-manager"
AC_SERVER_DIR="/opt/assetto-corsa-server"

# GitHub settings
GITHUB_REPO="Brewsker/ac-server-manager"
GITHUB_BRANCH="develop"
CACHE_BUST="?t=$(date +%s)"
GITHUB_RAW="https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}"

# Git cache server settings
GIT_CACHE_IP="192.168.1.70"
GIT_CACHE_CTID=998
GIT_CACHE_URL="http://${GIT_CACHE_IP}/ac-server-manager"
USE_GIT_CACHE=true  # Auto-detect and use git-cache if available

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="/tmp/ac-installer-$(date +%Y%m%d-%H%M%S).log"

###############################################################################
# Logging and Output Functions
###############################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

debug() {
    if [ "$DEBUG" = true ]; then
        echo -e "${MAGENTA}[DEBUG]${NC} $*" | tee -a "$LOG_FILE"
    fi
}

print_header() {
    echo -e "${CYAN}" | tee -a "$LOG_FILE"
    echo "═══════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
    echo "  🏎️  $1" | tee -a "$LOG_FILE"
    echo "═══════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
    echo -e "${NC}" | tee -a "$LOG_FILE"
}

print_section() {
    echo -e "\n${BLUE}▶ $1${NC}" | tee -a "$LOG_FILE"
    debug "Starting section: $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

###############################################################################
# Error Handling
###############################################################################

cleanup_on_error() {
    local exit_code=$?
    print_error "Installation failed with exit code: $exit_code"
    print_info "Log file saved to: $LOG_FILE"
    
    if [ "$DEBUG" = true ]; then
        print_warning "Debug mode: Container left running for inspection"
        print_info "To enter container: pct enter $CTID"
        print_info "To destroy container: pct destroy $CTID"
    fi
    
    exit $exit_code
}

trap cleanup_on_error ERR

###############################################################################
# Argument Parsing
###############################################################################

parse_args() {
    debug "Parsing command line arguments: $*"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --ctid)
                CTID="$2"
                debug "Container ID set to: $CTID"
                shift 2
                ;;
            --hostname)
                HOSTNAME="$2"
                debug "Hostname set to: $HOSTNAME"
                shift 2
                ;;
            --memory)
                MEMORY="$2"
                debug "Memory set to: ${MEMORY}MB"
                shift 2
                ;;
            --disk)
                DISK="$2"
                debug "Disk size set to: ${DISK}GB"
                shift 2
                ;;
            --cores)
                CORES="$2"
                debug "CPU cores set to: $CORES"
                shift 2
                ;;
            --storage)
                STORAGE="$2"
                debug "Storage pool set to: $STORAGE"
                shift 2
                ;;
            --template)
                TEMPLATE="$2"
                debug "Template set to: $TEMPLATE"
                shift 2
                ;;
            --password)
                PASSWORD="$2"
                debug "Password set (hidden)"
                shift 2
                ;;
            --keep-existing)
                DESTROY_EXISTING=false
                debug "Will keep existing container if present"
                shift
                ;;
            --debug)
                DEBUG=true
                debug "Debug mode enabled"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
$SCRIPT_NAME v$VERSION

Usage: $0 [options]

Options:
  --ctid <id>        Container ID (default: $CTID)
  --hostname <name>  Container hostname (default: $HOSTNAME)
  --memory <MB>      Memory in MB (default: $MEMORY)
  --disk <GB>        Disk size in GB (default: $DISK)
  --cores <n>        CPU cores (default: $CORES)
  --storage <name>   Storage pool (default: $STORAGE)
  --template <path>  LXC template (default: ubuntu-22.04)
  --password <pwd>   Root password (default: auto-generated)
  --keep-existing    Keep existing container (default: auto-replace)
  --debug            Enable verbose debugging
  --help, -h         Show this help message

Examples:
  # Basic installation (auto-replaces container 999 if exists)
  $0

  # Custom container with debugging
  $0 --ctid 100 --hostname my-ac-server --debug

  # Keep existing container (fail if exists)
  $0 --keep-existing --debug

EOF
}

###############################################################################
# Prerequisites Check
###############################################################################

ensure_git_cache() {
    print_section "Setting up git-cache server"
    
    # Check if git-cache container exists
    if ! pct status $GIT_CACHE_CTID &>/dev/null; then
        print_info "Git-cache container not found, creating it..."
        create_git_cache_container
        return
    fi
    
    # Check container version
    local current_version=$(pct exec $GIT_CACHE_CTID -- cat /etc/git-cache-version 2>/dev/null || echo "0")
    debug "Current git-cache version: $current_version"
    debug "Required git-cache version: $GIT_CACHE_VERSION"
    
    if [ "$current_version" != "$GIT_CACHE_VERSION" ]; then
        print_warning "Git-cache container outdated (v$current_version, need v$GIT_CACHE_VERSION)"
        print_info "Rebuilding git-cache container..."
        pct stop $GIT_CACHE_CTID &>/dev/null || true
        pct destroy $GIT_CACHE_CTID &>/dev/null || true
        create_git_cache_container
        return
    fi
    
    debug "Git-cache container is up to date (v$GIT_CACHE_VERSION)"
    
    # Check if container is running
    if ! pct status $GIT_CACHE_CTID | grep -q "running"; then
        print_info "Starting git-cache container..."
        pct start $GIT_CACHE_CTID
        sleep 3
        debug "Git-cache container started"
    fi
    
    # Verify nginx is accessible
    local max_wait=10
    local waited=0
    while ! curl -sf --connect-timeout 2 "${GIT_CACHE_URL}/README.md" &>/dev/null; do
        if [ $waited -ge $max_wait ]; then
            print_warning "Git-cache not responding after ${max_wait}s, falling back to GitHub"
            USE_GIT_CACHE=false
            return 1
        fi
        sleep 1
        waited=$((waited + 1))
        debug "Waiting for git-cache to respond... ${waited}s"
    done
    
    print_success "Git-cache server available at $GIT_CACHE_IP"
    USE_GIT_CACHE=true
    
    # Sync git-cache with GitHub (force update to latest)
    print_info "Syncing git-cache from GitHub..."
    pct exec $GIT_CACHE_CTID -- bash -c "cd /opt/git-cache/ac-server-manager && git fetch origin $GITHUB_BRANCH && git reset --hard origin/$GITHUB_BRANCH" >> "$LOG_FILE" 2>&1
    
    # Show latest commit
    local latest_commit=$(pct exec $GIT_CACHE_CTID -- bash -c "cd /opt/git-cache/ac-server-manager && git log -1 --oneline" 2>/dev/null)
    debug "Latest commit: $latest_commit"
    print_success "Git-cache synced to latest $GITHUB_BRANCH"
}

create_git_cache_container() {
    debug "Creating git-cache container..."
    
    local git_cache_storage="local-lvm"
    local git_cache_template="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
    local git_cache_password="GitCache123"
    local git_cache_ip="192.168.1.70/24"
    local git_cache_gateway="192.168.1.1"
    
    # Create container
    pct create $GIT_CACHE_CTID $git_cache_template \
        --hostname git-cache \
        --password "$git_cache_password" \
        --storage $git_cache_storage \
        --rootfs $git_cache_storage:10 \
        --memory 512 \
        --swap 256 \
        --net0 name=eth0,bridge=vmbr0,ip=$git_cache_ip,gw=$git_cache_gateway \
        --features nesting=1 \
        --unprivileged 1 \
        --onboot 1 \
        --start 1 \
        >> "$LOG_FILE" 2>&1
    
    debug "Git-cache container created"
    sleep 5
    
    # Install git and nginx
    print_info "Installing git and nginx in cache container..."
    pct exec $GIT_CACHE_CTID -- bash -c "apt-get update -qq && apt-get install -y git nginx-light" >> "$LOG_FILE" 2>&1
    
    # Clone repository
    print_info "Cloning repository to cache..."
    pct exec $GIT_CACHE_CTID -- bash -c "mkdir -p /opt/git-cache && cd /opt/git-cache && git clone https://github.com/${GITHUB_REPO}.git" >> "$LOG_FILE" 2>&1
    pct exec $GIT_CACHE_CTID -- bash -c "cd /opt/git-cache/ac-server-manager && git checkout $GITHUB_BRANCH" >> "$LOG_FILE" 2>&1
    
    # Configure nginx to serve git repository files
    print_info "Configuring nginx in cache container..."
    pct exec $GIT_CACHE_CTID -- bash -c 'cat > /etc/nginx/sites-available/git-cache <<EOF
server {
    listen 80;
    server_name _;
    
    location /ac-server-manager {
        alias /opt/git-cache/ac-server-manager;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        
        # Serve files directly
        try_files \$uri \$uri/ =404;
    }
    
    location / {
        root /opt/git-cache;
        autoindex on;
    }
}
EOF' >> "$LOG_FILE" 2>&1
    
    pct exec $GIT_CACHE_CTID -- bash -c "ln -sf /etc/nginx/sites-available/git-cache /etc/nginx/sites-enabled/default" >> "$LOG_FILE" 2>&1
    pct exec $GIT_CACHE_CTID -- systemctl restart nginx >> "$LOG_FILE" 2>&1
    
    # Write version file
    pct exec $GIT_CACHE_CTID -- bash -c "echo '$GIT_CACHE_VERSION' > /etc/git-cache-version" >> "$LOG_FILE" 2>&1
    debug "Git-cache version file created: v$GIT_CACHE_VERSION"
    
    print_success "Git-cache container created and configured (v$GIT_CACHE_VERSION)"
}

check_prerequisites() {
    print_section "Checking prerequisites"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
    debug "Running as root: OK"
    
    # Check if Proxmox commands are available
    if ! command -v pct &> /dev/null; then
        print_error "This script must be run on a Proxmox host (pct command not found)"
        exit 1
    fi
    debug "Proxmox commands available: OK"
    
    # Check if template exists
    if ! pvesm list local | grep -q "$(basename $TEMPLATE)"; then
        print_warning "Template not found in local storage: $(basename $TEMPLATE)"
        print_info "Available templates:"
        pvesm list local | grep vztmpl || print_warning "No templates found"
        print_info "Attempting to download template..."
        pveam update
        pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
    fi
    debug "Template check: OK"
    
    # Check storage pool
    if ! pvesm status | grep -q "^$STORAGE "; then
        print_error "Storage pool not found: $STORAGE"
        print_info "Available storage pools:"
        pvesm status
        exit 1
    fi
    debug "Storage pool '$STORAGE': OK"
    
    print_success "All prerequisites met"
}

###############################################################################
# Container Management
###############################################################################

check_existing_container() {
    if ! pct status $CTID &>/dev/null; then
        debug "Container $CTID does not exist - will create"
        return 1
    fi
    
    # Container exists - handle based on mode
    if [ "$DEV_MODE" = true ]; then
        print_warning "Container $CTID exists - destroying for clean dev testing"
        destroy_container
        return 1
    fi
    
    # Production mode - ask user
    print_warning "Container $CTID already exists"
    echo ""
    echo "Options:"
    echo "  1) Keep existing container and update it (faster)"
    echo "  2) Destroy and recreate container (clean slate)"
    echo "  3) Cancel installation"
    echo ""
    read -p "Choose option [1-3]: " choice
    
    case $choice in
        1)
            print_success "Keeping existing container - will update in place"
            return 0
            ;;
        2)
            destroy_container
            return 1
            ;;
        3)
            print_info "Installation cancelled by user"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

destroy_container() {
    print_section "Destroying existing container $CTID"
    debug "Checking container status..."
    
    if pct status $CTID | grep -q "running"; then
        print_info "Stopping container..."
        pct stop $CTID
        sleep 2
        debug "Container stopped"
    fi
    
    print_info "Destroying container..."
    pct destroy $CTID
    debug "Container destroyed"
    
    print_success "Container $CTID destroyed"
}

create_container() {
    print_section "Creating container $CTID"
    
    # Use default password if not provided
    if [ -z "$PASSWORD" ]; then
        PASSWORD="admin"
        debug "Using default password: admin"
    fi
    
    debug "Container configuration:"
    debug "  ID: $CTID"
    debug "  Hostname: $HOSTNAME"
    debug "  Cores: $CORES"
    debug "  Memory: ${MEMORY}MB"
    debug "  Disk: ${DISK}GB"
    debug "  Storage: $STORAGE"
    debug "  Template: $TEMPLATE"
    debug "  Network: $NETWORK_MODE"
    if [ "$NETWORK_MODE" = "static" ]; then
        debug "  IP: $STATIC_IP"
        debug "  Gateway: $GATEWAY"
    fi
    
    print_info "Creating container..."
    
    # Build network configuration
    local net_config
    if [ "$NETWORK_MODE" = "static" ]; then
        net_config="name=eth0,bridge=$BRIDGE,ip=$STATIC_IP,gw=$GATEWAY"
    else
        net_config="name=eth0,bridge=$BRIDGE,ip=dhcp"
    fi
    
    pct create $CTID $TEMPLATE \
        --hostname $HOSTNAME \
        --password "$PASSWORD" \
        --cores $CORES \
        --memory $MEMORY \
        --rootfs $STORAGE:$DISK \
        --net0 "$net_config" \
        --features nesting=1,keyctl=1 \
        --unprivileged 1 \
        --start 0 \
        >> "$LOG_FILE" 2>&1
    
    debug "Container created successfully"
    print_success "Container $CTID created"
}

start_container() {
    print_section "Starting container $CTID"
    
    # Check if already running
    if pct status $CTID 2>/dev/null | grep -q "running"; then
        debug "Container already running, skipping start"
        print_success "Container $CTID is running"
        return 0
    fi
    
    pct start $CTID
    debug "Start command issued"
    
    print_info "Waiting for container to boot..."
    sleep 5
    
    # Wait for container to be responsive (check via simple status, not pct exec)
    local max_wait=30
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if pct status $CTID 2>/dev/null | grep -q "running"; then
            # Container reports running, give it a moment to fully initialize
            sleep 3
            debug "Container is running"
            break
        fi
        sleep 1
        waited=$((waited + 1))
        debug "Waiting for container... ${waited}s"
    done
    
    if [ $waited -ge $max_wait ]; then
        print_error "Container failed to start after ${max_wait}s"
        exit 1
    fi
    
    debug "Container is responsive"
    print_success "Container started and responsive"
}

update_ssh_keys() {
    print_section "Setting up SSH access"
    
    local container_ip="$1"
    local ssh_known_hosts="$HOME/.ssh/known_hosts"
    
    # Remove old SSH keys
    if [ -f "$ssh_known_hosts" ]; then
        debug "Removing old SSH keys for $container_ip"
        ssh-keygen -R "$container_ip" >> "$LOG_FILE" 2>&1
        ssh-keygen -R "192.168.1.71" >> "$LOG_FILE" 2>&1
    fi
    
    # Enable password authentication in SSH
    enable_ssh_password_auth
    
    # Inject SSH public key into container for password-less access
    inject_ssh_key
    
    print_success "SSH access configured"
}

enable_ssh_password_auth() {
    debug "Enabling SSH password authentication"
    
    pct exec "$CTID" -- bash -c "sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config" >> "$LOG_FILE" 2>&1
    pct exec "$CTID" -- bash -c "sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config" >> "$LOG_FILE" 2>&1
    pct exec "$CTID" -- systemctl restart sshd >> "$LOG_FILE" 2>&1
    
    debug "SSH password authentication enabled"
}

inject_ssh_key() {
    debug "Injecting SSH public key into container $CTID"
    
    # Try to find SSH public key
    local ssh_key=""
    local key_locations=(
        "$HOME/.ssh/id_rsa.pub"
        "$HOME/.ssh/id_ed25519.pub"
        "$HOME/.ssh/id_ecdsa.pub"
    )
    
    for key_file in "${key_locations[@]}"; do
        if [ -f "$key_file" ]; then
            ssh_key=$(cat "$key_file")
            debug "Found SSH public key: $key_file"
            break
        fi
    done
    
    if [ -z "$ssh_key" ]; then
        print_warning "No SSH public key found - password authentication will be required"
        print_info "Generate key with: ssh-keygen -t ed25519"
        return 0
    fi
    
    # Create .ssh directory in container
    pct exec "$CTID" -- bash -c "mkdir -p /root/.ssh && chmod 700 /root/.ssh" >> "$LOG_FILE" 2>&1
    
    # Add public key to authorized_keys
    pct exec "$CTID" -- bash -c "echo '$ssh_key' >> /root/.ssh/authorized_keys" >> "$LOG_FILE" 2>&1
    
    # Set correct permissions
    pct exec "$CTID" -- bash -c "chmod 600 /root/.ssh/authorized_keys" >> "$LOG_FILE" 2>&1
    
    # Remove duplicates
    pct exec "$CTID" -- bash -c "sort -u /root/.ssh/authorized_keys -o /root/.ssh/authorized_keys" >> "$LOG_FILE" 2>&1
    
    print_success "SSH key injected - password-less SSH enabled"
}

get_container_ip() {
    print_section "Getting container IP address"
    
    local max_wait=30
    local waited=0
    local ip=""
    
    # If static IP, extract it immediately
    if [ "$NETWORK_MODE" = "static" ]; then
        ip="${STATIC_IP%/*}"  # Remove /24 netmask
        debug "Using static IP: $ip"
        print_success "Container IP: $ip (static)"
        echo "$ip"
        return 0
    fi
    
    # For DHCP, wait for IP assignment
    while [ -z "$ip" ]; do
        if [ $waited -ge $max_wait ]; then
            print_error "Failed to get container IP after ${max_wait}s"
            exit 1
        fi
        
        ip=$(pct exec $CTID -- hostname -I 2>/dev/null | awk '{print $1}' || true)
        
        if [ -z "$ip" ]; then
            sleep 1
            waited=$((waited + 1))
            debug "Waiting for IP assignment... ${waited}s"
        fi
    done
    
    debug "Container IP: $ip"
    print_success "Container IP: $ip (DHCP)"
    echo "$ip"
}

###############################################################################
# Bootstrap Installation
###############################################################################

install_bootstrap_packages() {
    print_section "Installing bootstrap packages"
    
    debug "Updating package lists..."
    pct exec $CTID -- apt-get update -qq >> "$LOG_FILE" 2>&1 || true
    
    debug "Installing curl, wget, and git..."
    pct exec $CTID -- bash -c "DEBIAN_FRONTEND=noninteractive apt-get install -y curl wget git" >> "$LOG_FILE" 2>&1 || true
    
    # Verify installation
    if pct exec $CTID -- test -x /usr/bin/curl 2>/dev/null; then
        print_success "Bootstrap packages installed"
    else
        print_warning "Bootstrap package installation may have issues, but continuing..."
    fi
}

install_nodejs() {
    print_section "Installing Node.js 20"
    
    debug "Removing any existing Node.js..."
    set +e  # Temporarily allow errors
    pct exec $CTID -- apt-get remove -y nodejs npm >> "$LOG_FILE" 2>&1
    pct exec $CTID -- apt-get autoremove -y >> "$LOG_FILE" 2>&1
    set -e  # Re-enable exit on error
    
    debug "Adding NodeSource repository..."
    set +e
    pct exec $CTID -- bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -" >> "$LOG_FILE" 2>&1
    set -e
    
    debug "Installing Node.js (this may take a moment)..."
    # Use SSH to run installation in container to avoid pct exec timeout issues
    # SSH should be configured and key injected at this point
    set +e
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$CONTAINER_IP "DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs > /tmp/nodejs-install.log 2>&1 && touch /tmp/nodejs-install-complete" >> "$LOG_FILE" 2>&1 &
    local install_pid=$!
    
    # Wait for installation to complete (max 120 seconds)
    local max_wait=120
    local waited=0
    debug "Waiting for Node.js installation to complete..."
    while [ $waited -lt $max_wait ]; do
        # Check if completion marker exists
        if pct exec $CTID -- test -f /tmp/nodejs-install-complete 2>/dev/null; then
            debug "Installation complete marker found"
            break
        fi
        # Check if ssh process is still running
        if ! kill -0 $install_pid 2>/dev/null; then
            debug "Installation process completed"
            break
        fi
        sleep 3
        waited=$((waited + 3))
        if [ $((waited % 15)) -eq 0 ]; then
            debug "Still waiting for Node.js installation... ${waited}s"
        fi
    done
    
    # Kill the background ssh if still running
    kill $install_pid 2>/dev/null || true
    set -e
    
    # Verify installation
    sleep 2
    if pct exec $CTID -- command -v node &>/dev/null; then
        local node_version=$(pct exec $CTID -- node -v 2>/dev/null || echo "unknown")
        print_success "Node.js installed: $node_version"
    else
        print_error "Node.js installation verification failed"
        debug "Installation log: $(pct exec $CTID -- cat /tmp/nodejs-install.log 2>/dev/null | tail -10)"
        return 1
    fi
}

###############################################################################
# Setup Wizard Deployment
###############################################################################

cleanup_existing_installation() {
    print_section "Cleaning up existing installation"
    
    debug "Stopping PM2 processes..."
    pct exec $CTID -- bash -c "command -v pm2 >/dev/null 2>&1 && pm2 delete all || true" >> "$LOG_FILE" 2>&1
    
    debug "Stopping wizard service..."
    pct exec $CTID -- systemctl stop ac-setup-wizard 2>/dev/null || true
    pct exec $CTID -- systemctl disable ac-setup-wizard 2>/dev/null || true
    
    debug "Removing old files..."
    pct exec $CTID -- rm -rf /opt/ac-setup >> "$LOG_FILE" 2>&1 || true
    pct exec $CTID -- rm -rf /opt/ac-server-manager >> "$LOG_FILE" 2>&1 || true
    pct exec $CTID -- rm -f /etc/systemd/system/ac-setup-wizard.service >> "$LOG_FILE" 2>&1 || true
    
    debug "Reloading systemd..."
    pct exec $CTID -- systemctl daemon-reload >> "$LOG_FILE" 2>&1 || true
    
    print_success "Existing installation cleaned up"
}

deploy_setup_wizard() {
    print_section "Deploying web-based setup wizard"
    
    debug "Creating setup directory: $SETUP_DIR"
    pct exec $CTID -- mkdir -p $SETUP_DIR
    
    # Determine download source
    local download_source
    if [ "$USE_GIT_CACHE" = true ]; then
        download_source="$GIT_CACHE_URL"
        debug "Downloading setup wizard files from git-cache ($GIT_CACHE_IP)..."
    else
        download_source="${GITHUB_RAW}"
        debug "Downloading setup wizard files from GitHub (cache-busting enabled)..."
    fi
    
    # Download setup wizard HTML
    print_info "Downloading setup-wizard.html..."
    if [ "$USE_GIT_CACHE" = true ]; then
        pct exec $CTID -- bash -c "curl -fsSL '${download_source}/setup-wizard.html' -o ${SETUP_DIR}/setup-wizard.html" >> "$LOG_FILE" 2>&1
    else
        pct exec $CTID -- bash -c "curl -fsSL '${download_source}/setup-wizard.html${CACHE_BUST}' -o ${SETUP_DIR}/setup-wizard.html" >> "$LOG_FILE" 2>&1
    fi
    debug "setup-wizard.html downloaded"
    
    # Download setup server script
    print_info "Downloading setup-server.js..."
    if [ "$USE_GIT_CACHE" = true ]; then
        pct exec $CTID -- bash -c "curl -fsSL '${download_source}/setup-server.js' -o ${SETUP_DIR}/setup-server.js" >> "$LOG_FILE" 2>&1
    else
        pct exec $CTID -- bash -c "curl -fsSL '${download_source}/setup-server.js${CACHE_BUST}' -o ${SETUP_DIR}/setup-server.js" >> "$LOG_FILE" 2>&1
    fi
    debug "setup-server.js downloaded"
    
    # Download installer script
    print_info "Downloading install-server.sh..."
    if [ "$USE_GIT_CACHE" = true ]; then
        pct exec $CTID -- bash -c "curl -fsSL '${download_source}/install-server.sh' -o ${SETUP_DIR}/install-server.sh" >> "$LOG_FILE" 2>&1
    else
        pct exec $CTID -- bash -c "curl -fsSL '${download_source}/install-server.sh${CACHE_BUST}' -o ${SETUP_DIR}/install-server.sh" >> "$LOG_FILE" 2>&1
    fi
    debug "install-server.sh downloaded"
    
    # Make installer executable
    pct exec $CTID -- chmod +x ${SETUP_DIR}/install-server.sh
    debug "Made installer executable"
    
    # Copy repo for update functionality (if using git-cache)
    if [ "$USE_GIT_CACHE" = true ]; then
        print_info "Copying repository for update functionality..."
        debug "Removing old copy if exists..."
        pct exec $CTID -- rm -rf /tmp/ac-setup-wizard >> "$LOG_FILE" 2>&1
        
        debug "Copying from git-cache container..."
        # Use pct push to copy the entire repo from git-cache to ac-server container
        if pct push $GIT_CACHE_CTID /opt/git-cache/ac-server-manager $CTID:/tmp/ac-setup-wizard >> "$LOG_FILE" 2>&1; then
            debug "Repository copied successfully for updates"
        else
            print_warning "Failed to copy repo for updates (update button will not work)"
            debug "Repo copy failed, check log for details"
        fi
    fi
    
    # Verify files
    debug "Verifying downloaded files..."
    pct exec $CTID -- ls -lh $SETUP_DIR/ >> "$LOG_FILE" 2>&1
    
    print_success "Setup wizard files deployed"
}

create_wizard_service() {
    print_section "Creating setup wizard systemd service"
    
    debug "Downloading service file..."
    if [ "$USE_GIT_CACHE" = true ]; then
        pct exec $CTID -- bash -c "curl -fsSL '${GIT_CACHE_URL}/ac-setup-wizard.service' -o /etc/systemd/system/ac-setup-wizard.service" >> "$LOG_FILE" 2>&1
    else
        pct exec $CTID -- bash -c "curl -fsSL '${GITHUB_RAW}/ac-setup-wizard.service${CACHE_BUST}' -o /etc/systemd/system/ac-setup-wizard.service" >> "$LOG_FILE" 2>&1
    fi
    
    debug "Reloading systemd..."
    pct exec $CTID -- systemctl daemon-reload >> "$LOG_FILE" 2>&1
    
    debug "Enabling service..."
    pct exec $CTID -- systemctl enable ac-setup-wizard.service >> "$LOG_FILE" 2>&1
    
    debug "Starting service..."
    pct exec $CTID -- systemctl start ac-setup-wizard.service >> "$LOG_FILE" 2>&1
    
    sleep 2
    
    # Verify service is running
    if pct exec $CTID -- systemctl is-active ac-setup-wizard.service | grep -q "active"; then
        debug "Setup wizard service is active"
        print_success "Setup wizard service started"
    else
        print_error "Setup wizard service failed to start"
        debug "Checking service status..."
        pct exec $CTID -- systemctl status ac-setup-wizard.service >> "$LOG_FILE" 2>&1
        exit 1
    fi
}

test_wizard_accessibility() {
    print_section "Testing wizard accessibility"
    
    debug "Waiting for wizard to be ready..."
    sleep 3
    
    local max_wait=30
    local waited=0
    
    while ! pct exec $CTID -- curl -sf http://localhost:$WIZARD_PORT/setup &>/dev/null; do
        if [ $waited -ge $max_wait ]; then
            print_error "Setup wizard not accessible after ${max_wait}s"
            debug "Checking service logs..."
            pct exec $CTID -- journalctl -u ac-setup-wizard.service -n 50 >> "$LOG_FILE" 2>&1
            exit 1
        fi
        sleep 1
        waited=$((waited + 1))
        debug "Waiting for wizard... ${waited}s"
    done
    
    debug "Setup wizard is accessible"
    print_success "Setup wizard is accessible"
}

###############################################################################
# Firewall Configuration
###############################################################################

configure_firewall() {
    print_section "Configuring firewall"
    
    if pct exec $CTID -- command -v ufw &>/dev/null; then
        debug "UFW detected, configuring rules..."
        
        pct exec $CTID -- ufw allow $WIZARD_PORT/tcp >> "$LOG_FILE" 2>&1
        debug "Allowed port $WIZARD_PORT/tcp for wizard"
        
        pct exec $CTID -- ufw allow 9600/tcp >> "$LOG_FILE" 2>&1
        pct exec $CTID -- ufw allow 9600/udp >> "$LOG_FILE" 2>&1
        pct exec $CTID -- ufw allow 8081/tcp >> "$LOG_FILE" 2>&1
        debug "Allowed AC server ports"
        
        print_success "Firewall rules configured"
    else
        debug "UFW not installed, skipping firewall configuration"
        print_warning "UFW not installed, manually open ports if needed"
    fi
}

###############################################################################
# Completion and Output
###############################################################################

show_completion() {
    local container_ip="$1"
    
    print_header "Installation Complete! 🎉"
    
    echo -e "${GREEN}"
    cat << EOF

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Setup wizard is ready!                                 ║
║   Open the web interface to complete installation        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

EOF
    echo -e "${NC}"
    
    echo "📍 Container Information:"
    echo "   Container ID:    $CTID"
    echo "   Hostname:        $HOSTNAME"
    echo "   IP Address:      $container_ip"
    echo "   Root Password:   $PASSWORD"
    echo ""
    
    echo "🌐 Web Interface:"
    echo "   Setup Wizard:    http://$container_ip:$WIZARD_PORT"
    echo "   Local Access:    http://localhost:$WIZARD_PORT (from container)"
    echo ""
    
    echo "📂 Installation Locations:"
    echo "   Setup Files:     $SETUP_DIR"
    echo "   App (future):    $APP_DIR"
    echo "   AC Server:       $AC_SERVER_DIR"
    echo ""
    
    echo "🔧 Container Commands:"
    echo "   Enter:           pct enter $CTID"
    echo "   Stop:            pct stop $CTID"
    echo "   Start:           pct start $CTID"
    echo "   Destroy:         pct destroy $CTID"
    echo ""
    
    echo "📝 Next Steps:"
    echo "   1. Open http://$container_ip:$WIZARD_PORT in your browser"
    echo "   2. Follow the setup wizard to configure installation"
    echo "   3. The wizard will automatically install AC Server Manager"
    echo "   4. After installation, access the app at http://$container_ip:3001"
    echo ""
    
    echo "🐛 Debug Information:"
    echo "   Log File:        $LOG_FILE"
    echo "   Service Status:  pct exec $CTID -- systemctl status ac-setup-wizard"
    echo "   Service Logs:    pct exec $CTID -- journalctl -u ac-setup-wizard -f"
    echo ""
    
    print_info "Installation log saved to: $LOG_FILE"
    
    if [ "$DEBUG" = true ]; then
        echo ""
        print_warning "Debug mode enabled - additional logging active"
    fi
}

###############################################################################
# Main Installation Flow
###############################################################################

main() {
    # Parse arguments
    parse_args "$@"
    
    # Show header
    clear
    print_header "$SCRIPT_NAME v$VERSION"
    
    log "Starting unified installation"
    log "Script date: $SCRIPT_DATE (Git-cache v$GIT_CACHE_VERSION required)"
    log "Log file: $LOG_FILE"
    
    if [ "$DEV_MODE" = true ]; then
        print_warning "Development mode - will destroy existing containers"
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Ensure git-cache is available and synced
    ensure_git_cache
    
    # Container setup - check_existing_container returns 0 if keeping, 1 if need to create
    if check_existing_container; then
        # Keeping existing container
        print_info "Using existing container $CTID"
        
        # Make sure it's running
        if ! pct status $CTID | grep -q "running"; then
            start_container
        fi
    else
        # Need to create new container
        create_container
        start_container
    fi
    
    container_ip=$(get_container_ip)
    export CONTAINER_IP="$container_ip"  # Make available to subfunctions
    
    update_ssh_keys "$container_ip"
    
    # Clean up any existing installation
    cleanup_existing_installation
    
    # Bootstrap
    install_bootstrap_packages
    install_nodejs
    
    # Deploy wizard
    deploy_setup_wizard
    create_wizard_service
    test_wizard_accessibility
    
    # Finalize
    configure_firewall
    
    # Success!
    show_completion "$container_ip"
}

###############################################################################
# Execute Main
###############################################################################

main "$@"

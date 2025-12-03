#!/bin/bash
###############################################################################
# AC Server Manager - Proxmox Auto-Installer
# 
# This script runs on Proxmox HOST and:
# 1. Creates Ubuntu 22.04 LXC container
# 2. Configures container (nesting, resources)
# 3. Starts container
# 4. Runs installation inside container
# 5. Sets up networking
#
# Usage: Run on Proxmox host as root
#        curl -sSL <url>/install-proxmox.sh | bash
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="ac-manager"
CONTAINER_HOSTNAME="ac-manager"
CONTAINER_PASSWORD=""  # Will prompt
STORAGE="local-lvm"    # Default Proxmox storage
TEMPLATE_STORAGE="local"
TEMPLATE="ubuntu-22.04-standard"
CONTAINER_CORES="2"
CONTAINER_RAM="2048"
CONTAINER_SWAP="512"
CONTAINER_DISK="20"
NETWORK_BRIDGE="vmbr0"
INSTALL_TYPE=""        # Will prompt: docker or pm2
STEAM_USER=""
STEAM_PASS=""
DOWNLOAD_AC="no"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "  🏎️  $1"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

check_proxmox() {
    if [ ! -f /etc/pve/.version ]; then
        print_error "This script must be run on a Proxmox VE host"
        exit 1
    fi
    
    PVE_VERSION=$(cat /etc/pve/.version)
    print_success "Proxmox VE $PVE_VERSION detected"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "This script must be run as root"
        exit 1
    fi
}

###############################################################################
# Pre-Installation Prompts
###############################################################################

show_welcome() {
    clear
    print_header "AC Server Manager - Proxmox Auto-Installer"
    echo -e "${CYAN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   This installer will CREATE an LXC container and        ║
    ║   install AC Server Manager inside it automatically.     ║
    ║                                                           ║
    ║   What will be created:                                  ║
    ║   • Ubuntu 22.04 LXC container                          ║
    ║   • 2 CPU cores, 2GB RAM, 20GB disk                     ║
    ║   • Nesting enabled (for Docker support)                ║
    ║   • Network bridge to your Proxmox network              ║
    ║                                                           ║
    ║   What will be installed inside:                         ║
    ║   • Node.js 20 LTS OR Docker                            ║
    ║   • AC Server Manager application                        ║
    ║   • Assetto Corsa Dedicated Server (optional)           ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
}

prompt_container_id() {
    print_step "Container Configuration"
    echo ""
    
    # Find next available CT ID
    NEXT_ID=$(pvesh get /cluster/nextid)
    
    read -p "Container ID [$NEXT_ID]: " CONTAINER_ID
    if [ -z "$CONTAINER_ID" ]; then
        CONTAINER_ID=$NEXT_ID
    fi
    
    # Check if ID already exists
    if pct status $CONTAINER_ID &>/dev/null; then
        print_error "Container ID $CONTAINER_ID already exists!"
        read -p "Enter a different ID: " CONTAINER_ID
    fi
    
    print_info "Will create container with ID: $CONTAINER_ID"
}

prompt_container_password() {
    echo ""
    while true; do
        read -sp "Set root password for container: " CONTAINER_PASSWORD
        echo ""
        read -sp "Confirm password: " CONTAINER_PASSWORD_CONFIRM
        echo ""
        
        if [ "$CONTAINER_PASSWORD" = "$CONTAINER_PASSWORD_CONFIRM" ]; then
            break
        else
            print_error "Passwords do not match. Try again."
        fi
    done
}

prompt_resources() {
    print_step "Container Resources"
    echo ""
    
    read -p "CPU cores [$CONTAINER_CORES]: " cores
    [ -n "$cores" ] && CONTAINER_CORES=$cores
    
    read -p "RAM (MB) [$CONTAINER_RAM]: " ram
    [ -n "$ram" ] && CONTAINER_RAM=$ram
    
    read -p "Disk (GB) [$CONTAINER_DISK]: " disk
    [ -n "$disk" ] && CONTAINER_DISK=$disk
    
    print_info "Resources: ${CONTAINER_CORES}C / ${CONTAINER_RAM}MB RAM / ${CONTAINER_DISK}GB disk"
}

prompt_storage() {
    print_step "Storage Configuration"
    echo ""
    
    # List available storages
    print_info "Available storages:"
    pvesm status | grep -E "(local-lvm|local|dir)" | awk '{print "  - " $1 " (" $2 ")"}'
    echo ""
    
    read -p "Storage for container [$STORAGE]: " storage
    [ -n "$storage" ] && STORAGE=$storage
}

prompt_installation_type() {
    print_step "Installation Type"
    echo ""
    echo "Choose installation method:"
    echo "1) Docker (recommended - easier updates, isolated)"
    echo "2) PM2 (direct - less overhead, faster)"
    echo ""
    read -p "Select [1-2]: " install_choice
    
    case $install_choice in
        2)
            INSTALL_TYPE="pm2"
            print_info "PM2 installation selected"
            ;;
        *)
            INSTALL_TYPE="docker"
            print_info "Docker installation selected"
            ;;
    esac
}

prompt_ac_server() {
    print_step "Assetto Corsa Dedicated Server"
    echo ""
    read -p "Download AC server via Steam? (y/n): " download_ac
    
    if [[ $download_ac =~ ^[Yy]$ ]]; then
        DOWNLOAD_AC="yes"
        echo ""
        print_warning "Steam credentials required"
        read -p "Steam username: " STEAM_USER
        read -sp "Steam password: " STEAM_PASS
        echo ""
    else
        DOWNLOAD_AC="no"
        print_info "You can configure AC server path later in the web UI"
    fi
}

confirm_installation() {
    echo ""
    print_header "Installation Summary"
    echo ""
    echo "Container ID:      $CONTAINER_ID"
    echo "Container Name:    $CONTAINER_NAME"
    echo "Resources:         ${CONTAINER_CORES} CPU / ${CONTAINER_RAM}MB RAM / ${CONTAINER_DISK}GB disk"
    echo "Storage:           $STORAGE"
    echo "Install Type:      $INSTALL_TYPE"
    echo "AC Server:         $([ "$DOWNLOAD_AC" = "yes" ] && echo "Will download via Steam" || echo "Configure later")"
    echo ""
    read -p "Proceed with installation? (y/n): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
}

###############################################################################
# Container Creation
###############################################################################

download_template() {
    print_step "Checking Ubuntu template"
    
    # Check if template already exists
    if pveam list $TEMPLATE_STORAGE | grep -q "ubuntu-22.04-standard"; then
        print_success "Ubuntu 22.04 template already downloaded"
        TEMPLATE_FILE=$(pveam list $TEMPLATE_STORAGE | grep "ubuntu-22.04-standard" | awk '{print $1}')
        return
    fi
    
    print_info "Downloading Ubuntu 22.04 template (this may take a few minutes)..."
    pveam update
    
    # Find latest Ubuntu 22.04 template
    TEMPLATE_FILE=$(pveam available | grep "ubuntu-22.04-standard" | tail -1 | awk '{print $2}')
    
    if [ -z "$TEMPLATE_FILE" ]; then
        print_error "Could not find Ubuntu 22.04 template"
        exit 1
    fi
    
    pveam download $TEMPLATE_STORAGE $TEMPLATE_FILE
    print_success "Template downloaded"
}

create_container() {
    print_step "Creating LXC container"
    
    # Get template path
    TEMPLATE_PATH="${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE_FILE}"
    
    # Create container
    pct create $CONTAINER_ID $TEMPLATE_PATH \
        --hostname $CONTAINER_HOSTNAME \
        --password "$CONTAINER_PASSWORD" \
        --cores $CONTAINER_CORES \
        --memory $CONTAINER_RAM \
        --swap $CONTAINER_SWAP \
        --storage $STORAGE \
        --rootfs $STORAGE:$CONTAINER_DISK \
        --net0 name=eth0,bridge=$NETWORK_BRIDGE,ip=dhcp \
        --features nesting=1,keyctl=1 \
        --unprivileged 1 \
        --onboot 1 \
        --start 0
    
    print_success "Container $CONTAINER_ID created"
}

start_container() {
    print_step "Starting container"
    
    pct start $CONTAINER_ID
    
    # Wait for container to be ready
    print_info "Waiting for container to initialize..."
    sleep 5
    
    # Wait for network
    for i in {1..30}; do
        if pct exec $CONTAINER_ID -- ping -c 1 8.8.8.8 &>/dev/null; then
            print_success "Container network ready"
            break
        fi
        sleep 1
    done
    
    # Get container IP
    CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}')
    print_info "Container IP: $CONTAINER_IP"
}

###############################################################################
# Software Installation Inside Container
###############################################################################

install_in_container() {
    print_step "Installing software inside container"
    
    # Create installation script
    cat > /tmp/install-ac-manager.sh << 'INSTALL_SCRIPT'
#!/bin/bash
set -e

# Update system
apt-get update -qq
apt-get upgrade -y -qq

# Install basic tools
apt-get install -y curl wget git

INSTALL_SCRIPT
    
    # Add installation type specific commands
    if [ "$INSTALL_TYPE" = "docker" ]; then
        cat >> /tmp/install-ac-manager.sh << 'INSTALL_SCRIPT'

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
apt-get install -y docker-compose

# Enable Docker
systemctl enable docker
systemctl start docker

INSTALL_SCRIPT
    else
        cat >> /tmp/install-ac-manager.sh << 'INSTALL_SCRIPT'

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2
pm2 startup systemd -u root --hp /root

INSTALL_SCRIPT
    fi
    
    # Add AC Server Manager installation
    cat >> /tmp/install-ac-manager.sh << 'INSTALL_SCRIPT'

# Clone AC Server Manager
mkdir -p /opt/ac-server-manager
cd /opt/ac-server-manager
git clone https://github.com/Brewsker/ac-server-manager.git .

# Install dependencies
cd backend
npm ci --production
cd ../frontend
npm ci
npm run build

# Create .env
cd /opt/ac-server-manager/backend
cp .env.example .env
sed -i 's|NODE_ENV=.*|NODE_ENV=production|' .env
sed -i 's|PORT=.*|PORT=3001|' .env

# Create data directories
mkdir -p data/presets data/cm-packs logs

INSTALL_SCRIPT
    
    # Add service startup
    if [ "$INSTALL_TYPE" = "docker" ]; then
        cat >> /tmp/install-ac-manager.sh << 'INSTALL_SCRIPT'

# Start with Docker Compose
cd /opt/ac-server-manager
docker-compose up -d

INSTALL_SCRIPT
    else
        cat >> /tmp/install-ac-manager.sh << 'INSTALL_SCRIPT'

# Start with PM2
cd /opt/ac-server-manager/backend
pm2 start src/server.js --name ac-server-manager
pm2 save

INSTALL_SCRIPT
    fi
    
    # Copy script to container and execute
    pct push $CONTAINER_ID /tmp/install-ac-manager.sh /tmp/install.sh
    pct exec $CONTAINER_ID -- chmod +x /tmp/install.sh
    
    print_info "Running installation (this will take 5-10 minutes)..."
    pct exec $CONTAINER_ID -- /tmp/install.sh
    
    print_success "Installation complete"
    
    # Cleanup
    rm /tmp/install-ac-manager.sh
    pct exec $CONTAINER_ID -- rm /tmp/install.sh
}

install_ac_server() {
    if [ "$DOWNLOAD_AC" != "yes" ]; then
        return
    fi
    
    print_step "Installing Assetto Corsa Dedicated Server"
    
    # Create AC installation script
    cat > /tmp/install-ac.sh << INSTALL_AC
#!/bin/bash
set -e

# Add i386 architecture
dpkg --add-architecture i386
apt-get update -qq

# Install SteamCMD
echo steam steam/question select "I AGREE" | debconf-set-selections
echo steam steam/license note '' | debconf-set-selections
apt-get install -y steamcmd lib32gcc-s1

# Create install script
cat > /tmp/steamcmd_install.txt << EOF
@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
force_install_dir /opt/assetto-corsa-server
login $STEAM_USER $STEAM_PASS
app_update 302550 validate
quit
EOF

# Run SteamCMD
/usr/games/steamcmd +runscript /tmp/steamcmd_install.txt

# Make executable
chmod +x /opt/assetto-corsa-server/acServer

# Update .env with AC paths
cd /opt/ac-server-manager/backend
sed -i 's|AC_SERVER_PATH=.*|AC_SERVER_PATH=/opt/assetto-corsa-server/acServer|' .env
sed -i 's|AC_SERVER_CONFIG_PATH=.*|AC_SERVER_CONFIG_PATH=/opt/assetto-corsa-server/cfg/server_cfg.ini|' .env
sed -i 's|AC_ENTRY_LIST_PATH=.*|AC_ENTRY_LIST_PATH=/opt/assetto-corsa-server/cfg/entry_list.ini|' .env
sed -i 's|AC_CONTENT_PATH=.*|AC_CONTENT_PATH=/opt/assetto-corsa-server/content|' .env

rm /tmp/steamcmd_install.txt
INSTALL_AC
    
    # Copy and execute
    pct push $CONTAINER_ID /tmp/install-ac.sh /tmp/install-ac.sh
    pct exec $CONTAINER_ID -- chmod +x /tmp/install-ac.sh
    
    print_info "Downloading AC server via Steam (this may take 10-15 minutes)..."
    print_warning "If Steam Guard is enabled, you'll need to enter the code"
    echo ""
    
    pct exec $CONTAINER_ID -- /tmp/install-ac.sh || print_warning "AC installation may have failed - check Steam credentials"
    
    # Cleanup
    rm /tmp/install-ac.sh
    pct exec $CONTAINER_ID -- rm /tmp/install-ac.sh
}

configure_firewall() {
    print_step "Configuring firewall"
    
    pct exec $CONTAINER_ID -- bash << 'EOF'
if command -v ufw &>/dev/null; then
    ufw --force enable
    ufw allow 3001/tcp
    ufw allow 9600/tcp
    ufw allow 9600/udp
    ufw allow 8081/tcp
fi
EOF
    
    print_success "Firewall configured"
}

###############################################################################
# Post-Installation
###############################################################################

run_health_check() {
    print_step "Running health check"
    
    sleep 3
    
    # Check if service is running
    if [ "$INSTALL_TYPE" = "docker" ]; then
        if pct exec $CONTAINER_ID -- docker ps | grep -q ac-server-manager; then
            print_success "Service running"
        else
            print_warning "Service may not be running - check logs"
        fi
    else
        if pct exec $CONTAINER_ID -- pm2 list | grep -q online; then
            print_success "Service running"
        else
            print_warning "Service may not be running - check logs"
        fi
    fi
    
    # Check HTTP
    sleep 2
    if pct exec $CONTAINER_ID -- curl -sf http://localhost:3001/health &>/dev/null; then
        print_success "Application responding"
    else
        print_warning "Application not responding yet (may need more time)"
    fi
}

show_completion() {
    print_header "Installation Complete! 🎉"
    
    # Get IPs
    CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}')
    HOST_IP=$(hostname -I | awk '{print $1}')
    
    echo -e "${GREEN}"
    cat << EOF

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   AC Server Manager is now running in LXC container!     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

EOF
    echo -e "${NC}"
    
    echo "📍 Access URLs:"
    echo "   • Container IP:   http://$CONTAINER_IP:3001"
    echo "   • From host:      http://$HOST_IP:3001 (if port forwarded)"
    echo ""
    
    echo "🐳 Container Information:"
    echo "   • Container ID:   $CONTAINER_ID"
    echo "   • Container IP:   $CONTAINER_IP"
    echo "   • Hostname:       $CONTAINER_HOSTNAME"
    echo "   • Root password:  (you set this)"
    echo ""
    
    echo "🔧 Proxmox Commands:"
    echo "   • Enter container:  pct enter $CONTAINER_ID"
    echo "   • Start container:  pct start $CONTAINER_ID"
    echo "   • Stop container:   pct stop $CONTAINER_ID"
    echo "   • Container logs:   pct exec $CONTAINER_ID -- journalctl -f"
    echo ""
    
    if [ "$INSTALL_TYPE" = "docker" ]; then
        echo "🐳 Inside Container (Docker):"
        echo "   • View logs:      docker-compose logs -f"
        echo "   • Restart:        docker-compose restart"
    else
        echo "🔧 Inside Container (PM2):"
        echo "   • View logs:      pm2 logs ac-server-manager"
        echo "   • Restart:        pm2 restart ac-server-manager"
    fi
    
    echo ""
    echo "📚 Next Steps:"
    echo "   1. Open http://$CONTAINER_IP:3001 in your browser"
    echo "   2. Complete Setup Wizard (if AC paths not configured)"
    echo "   3. Create your first server configuration"
    echo "   4. Start racing! 🏁"
    echo ""
    
    print_info "Container will auto-start on Proxmox boot"
    echo ""
}

###############################################################################
# Main Installation Flow
###############################################################################

main() {
    show_welcome
    
    check_root
    check_proxmox
    
    # Interactive prompts
    prompt_container_id
    prompt_container_password
    prompt_resources
    prompt_storage
    prompt_installation_type
    prompt_ac_server
    confirm_installation
    
    echo ""
    print_header "Starting Installation"
    
    # Container setup
    download_template
    create_container
    start_container
    
    # Software installation
    install_in_container
    
    # Optional AC server
    if [ "$DOWNLOAD_AC" = "yes" ]; then
        install_ac_server
    fi
    
    # Finalization
    configure_firewall
    run_health_check
    
    # Success!
    show_completion
}

# Run main installation
main "$@"

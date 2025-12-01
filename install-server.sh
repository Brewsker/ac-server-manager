#!/bin/bash
###############################################################################
# AC Server Manager - One-Click Server Installer
# 
# This script installs AC Server Manager on a fresh Linux server (Ubuntu/Debian)
# Handles: System packages, Node.js, SteamCMD, AC Dedicated Server, App setup
#
# Usage: curl -sSL <raw-github-url>/install-server.sh | bash
#        OR: ./install-server.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="AC Server Manager"
APP_DIR="/opt/ac-server-manager"
AC_SERVER_DIR="/opt/assetto-corsa-server"
STEAM_USER=""
STEAM_PASS=""
INSTALL_AC_SERVER="yes"
USE_DOCKER="no"
NODE_VERSION="20"

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

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS. This script requires Ubuntu/Debian."
        exit 1
    fi

    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        print_error "This script only supports Ubuntu/Debian. Detected: $OS"
        exit 1
    fi

    print_success "Detected: $PRETTY_NAME"
}

ensure_wget_or_curl() {
    # Check if we have wget or curl for downloading
    if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
        print_step "Installing wget for downloads..."
        apt-get update -qq
        apt-get install -y wget
        print_success "wget installed"
    fi
}

###############################################################################
# Pre-Installation Prompts
###############################################################################

show_welcome() {
    clear
    print_header "$APP_NAME - One-Click Installer"
    echo -e "${CYAN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   This installer will set up AC Server Manager on your   ║
    ║   server. It will install all dependencies and           ║
    ║   optionally download the Assetto Corsa Dedicated        ║
    ║   Server using SteamCMD.                                 ║
    ║                                                           ║
    ║   What will be installed:                                ║
    ║   • Node.js 20 LTS                                       ║
    ║   • Git                                                  ║
    ║   • PM2 (process manager)                                ║
    ║   • SteamCMD (if downloading AC)                         ║
    ║   • Assetto Corsa Dedicated Server (optional)            ║
    ║   • AC Server Manager application                        ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
}

prompt_installation_type() {
    print_step "Choose installation type"
    echo ""
    echo "1) Full Installation (Node.js + PM2 + App)"
    echo "2) Docker Installation (Docker + Docker Compose)"
    echo "3) App Only (assumes Node.js already installed)"
    echo ""
    read -p "Select option [1-3]: " install_choice

    case $install_choice in
        2)
            USE_DOCKER="yes"
            print_info "Docker installation selected"
            ;;
        3)
            print_info "App-only installation selected"
            ;;
        *)
            print_info "Full installation selected"
            ;;
    esac
}

prompt_ac_server() {
    print_step "Assetto Corsa Dedicated Server"
    echo ""
    read -p "Do you want to download AC Dedicated Server via Steam? (y/n): " download_ac
    
    if [[ $download_ac =~ ^[Yy]$ ]]; then
        INSTALL_AC_SERVER="yes"
        echo ""
        print_warning "Steam credentials required for downloading AC server"
        print_info "Your credentials are only used locally and not stored"
        echo ""
        read -p "Steam username: " STEAM_USER
        read -sp "Steam password: " STEAM_PASS
        echo ""
        
        # Ask about Steam Guard
        echo ""
        print_warning "If you have Steam Guard enabled, you'll need the code"
        read -p "Press Enter to continue..."
        
    else
        INSTALL_AC_SERVER="no"
        echo ""
        print_info "Skipping AC server download"
        read -p "Enter path to existing AC server installation: " AC_SERVER_DIR
    fi
}

prompt_installation_dir() {
    print_step "Installation Directory"
    echo ""
    read -p "Install location [$APP_DIR]: " custom_dir
    
    if [ -n "$custom_dir" ]; then
        APP_DIR="$custom_dir"
    fi
    
    print_info "Will install to: $APP_DIR"
}

confirm_installation() {
    echo ""
    print_header "Installation Summary"
    echo ""
    echo "Installation Type: $([ "$USE_DOCKER" = "yes" ] && echo "Docker" || echo "Node.js + PM2")"
    echo "App Directory:     $APP_DIR"
    echo "AC Server:         $([ "$INSTALL_AC_SERVER" = "yes" ] && echo "Will download" || echo "$AC_SERVER_DIR")"
    echo ""
    read -p "Proceed with installation? (y/n): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
}

###############################################################################
# System Package Installation
###############################################################################

install_system_packages() {
    print_step "Installing system packages"
    
    # Build list of packages to install
    PACKAGES_TO_INSTALL=()
    
    # Check each package
    for pkg in curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release lib32gcc-s1 lib32stdc++6; do
        if ! dpkg -l | grep -q "^ii  $pkg "; then
            PACKAGES_TO_INSTALL+=("$pkg")
        fi
    done
    
    # Install only missing packages
    if [ ${#PACKAGES_TO_INSTALL[@]} -gt 0 ]; then
        apt-get update -qq
        apt-get install -y "${PACKAGES_TO_INSTALL[@]}" > /dev/null 2>&1
        print_success "Installed ${#PACKAGES_TO_INSTALL[@]} system packages"
    else
        print_success "All system packages already installed"
    fi
}

install_nodejs() {
    print_step "Installing Node.js $NODE_VERSION"
    
    # Check if Node.js already installed
    if command -v node &> /dev/null; then
        CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_NODE" -ge "$NODE_VERSION" ]; then
            print_success "Node.js $CURRENT_NODE already installed"
            return
        fi
    fi
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    
    # Verify installation
    if command -v node &> /dev/null; then
        print_success "Node.js $(node -v) installed"
        print_success "npm $(npm -v) installed"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
}

install_pm2() {
    print_step "Installing PM2 process manager"
    
    if command -v pm2 &> /dev/null; then
        print_success "PM2 already installed"
        return
    fi
    
    npm install -g pm2 > /dev/null 2>&1
    
    # Setup PM2 startup script
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root > /dev/null 2>&1
    
    print_success "PM2 installed and configured"
}

install_docker() {
    print_step "Installing Docker"
    
    if command -v docker &> /dev/null; then
        print_success "Docker already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh > /dev/null 2>&1
    rm get-docker.sh
    
    # Install Docker Compose
    apt-get install -y docker-compose > /dev/null 2>&1
    
    # Enable Docker service
    systemctl enable docker > /dev/null 2>&1
    systemctl start docker > /dev/null 2>&1
    
    print_success "Docker and Docker Compose installed"
}

###############################################################################
# SteamCMD & AC Server Installation
###############################################################################

install_steamcmd() {
    print_step "Installing SteamCMD"
    
    # Add i386 architecture (required for SteamCMD)
    dpkg --add-architecture i386
    apt-get update -qq
    
    # Accept Steam license
    echo steam steam/question select "I AGREE" | debconf-set-selections
    echo steam steam/license note '' | debconf-set-selections
    
    # Install SteamCMD
    apt-get install -y steamcmd > /dev/null 2>&1
    
    # Create symlink if it doesn't exist
    if [ ! -f /usr/games/steamcmd ]; then
        ln -s /usr/games/steamcmd /usr/local/bin/steamcmd 2>/dev/null || true
    fi
    
    print_success "SteamCMD installed"
}

download_ac_server() {
    print_step "Downloading Assetto Corsa Dedicated Server"
    
    mkdir -p "$AC_SERVER_DIR"
    
    # Create SteamCMD script
    cat > /tmp/install_ac.txt << EOF
@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
force_install_dir $AC_SERVER_DIR
login $STEAM_USER $STEAM_PASS
app_update 302550 validate
quit
EOF
    
    print_info "This may take several minutes..."
    print_warning "If Steam Guard is enabled, you'll be prompted for the code"
    echo ""
    
    # Run SteamCMD
    /usr/games/steamcmd +runscript /tmp/install_ac.txt
    
    rm /tmp/install_ac.txt
    
    # Verify installation
    if [ -f "$AC_SERVER_DIR/acServer" ]; then
        print_success "AC Dedicated Server downloaded"
        
        # Make server executable
        chmod +x "$AC_SERVER_DIR/acServer"
        
        # Show server info
        AC_VERSION=$("$AC_SERVER_DIR/acServer" -v 2>&1 | head -n1 || echo "Unknown")
        print_info "Server version: $AC_VERSION"
    else
        print_error "AC server download failed"
        print_warning "You may need to manually download it or check Steam credentials"
        read -p "Enter path to existing AC installation: " AC_SERVER_DIR
    fi
}

###############################################################################
# Application Installation
###############################################################################

install_application() {
    print_step "Installing AC Server Manager"
    
    # Create directory
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone repository (or use current directory if already cloned)
    if [ ! -d ".git" ]; then
        print_info "Cloning repository..."
        if git clone -b multi-instance-manager https://github.com/Brewsker/ac-server-manager.git . 2>&1 | grep -v "Cloning into"; then
            print_success "Repository cloned"
        else
            print_error "Failed to clone repository"
            print_info "You may need to clone manually or check your internet connection"
            exit 1
        fi
    else
        print_info "Using existing repository"
    fi
    
    print_success "Repository ready"
}

install_dependencies() {
    print_step "Installing application dependencies"
    
    cd "$APP_DIR"
    
    # Backend dependencies
    print_info "Installing backend dependencies..."
    cd backend
    npm ci --production > /dev/null 2>&1
    cd ..
    
    # Frontend dependencies and build
    print_info "Installing frontend dependencies..."
    cd frontend
    npm ci > /dev/null 2>&1
    
    print_info "Building frontend..."
    npm run build > /dev/null 2>&1
    cd ..
    
    print_success "Dependencies installed and frontend built"
}

configure_application() {
    print_step "Configuring application"
    
    cd "$APP_DIR/backend"
    
    # Create .env file
    if [ ! -f .env ]; then
        cp .env.example .env
        
        # Set AC server paths
        sed -i "s|AC_SERVER_PATH=.*|AC_SERVER_PATH=$AC_SERVER_DIR/acServer|" .env
        sed -i "s|AC_SERVER_CONFIG_PATH=.*|AC_SERVER_CONFIG_PATH=$AC_SERVER_DIR/cfg/server_cfg.ini|" .env
        sed -i "s|AC_ENTRY_LIST_PATH=.*|AC_ENTRY_LIST_PATH=$AC_SERVER_DIR/cfg/entry_list.ini|" .env
        sed -i "s|AC_CONTENT_PATH=.*|AC_CONTENT_PATH=$AC_SERVER_DIR/content|" .env
        
        # Set production mode
        sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env
        sed -i "s|PORT=.*|PORT=3001|" .env
    fi
    
    # Create necessary directories
    mkdir -p data/presets data/cm-packs logs
    
    print_success "Application configured"
}

###############################################################################
# Service Setup
###############################################################################

setup_pm2_service() {
    print_step "Setting up PM2 service"
    
    cd "$APP_DIR/backend"
    
    # Stop any existing instance
    pm2 delete ac-server-manager 2>/dev/null || true
    
    # Start application
    pm2 start src/server.js \
        --name ac-server-manager \
        --cwd "$APP_DIR/backend" \
        --env production \
        --time \
        --max-memory-restart 500M \
        > /dev/null 2>&1
    
    # Save PM2 configuration
    pm2 save > /dev/null 2>&1
    
    print_success "PM2 service configured"
}

setup_docker_service() {
    print_step "Setting up Docker service"
    
    cd "$APP_DIR"
    
    # Update docker-compose.yml with AC server path
    sed -i "s|/path/to/assetto-corsa-server|$AC_SERVER_DIR|g" docker-compose.yml
    
    # Build and start containers
    docker-compose build > /dev/null 2>&1
    docker-compose up -d > /dev/null 2>&1
    
    print_success "Docker service started"
}

setup_firewall() {
    print_step "Configuring firewall"
    
    # Check if ufw is installed
    if command -v ufw &> /dev/null; then
        # Allow web interface port
        ufw allow 3001/tcp > /dev/null 2>&1
        
        # Allow AC server ports (if needed)
        ufw allow 9600/tcp > /dev/null 2>&1  # AC server HTTP
        ufw allow 9600/udp > /dev/null 2>&1  # AC server UDP
        ufw allow 8081/tcp > /dev/null 2>&1  # AC server TCP
        
        print_success "Firewall rules added"
    else
        print_warning "UFW not installed, skipping firewall configuration"
        print_info "Manually open ports: 3001 (web UI), 9600 (AC server)"
    fi
}

###############################################################################
# Post-Installation
###############################################################################

run_health_check() {
    print_step "Running health check"
    
    sleep 3  # Give service time to start
    
    if [ "$USE_DOCKER" = "yes" ]; then
        # Check Docker container
        if docker ps | grep -q ac-server-manager; then
            print_success "Docker container running"
        else
            print_error "Docker container not running"
            docker-compose logs --tail=20
            return 1
        fi
    else
        # Check PM2 process
        if pm2 list | grep -q "ac-server-manager.*online"; then
            print_success "PM2 service running"
        else
            print_error "PM2 service not running"
            pm2 logs ac-server-manager --lines 20 --nostream
            return 1
        fi
    fi
    
    # Check HTTP endpoint
    sleep 2
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Application responding"
    else
        print_warning "Application not responding yet (may need more time)"
    fi
}

show_completion() {
    print_header "Installation Complete! 🎉"
    
    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo -e "${GREEN}"
    cat << EOF

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   AC Server Manager is now running!                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

EOF
    echo -e "${NC}"
    
    echo "📍 Access URLs:"
    echo "   • Web Interface:  http://$SERVER_IP:3001"
    echo "   • Local Access:   http://localhost:3001"
    echo ""
    
    echo "📂 Installation Locations:"
    echo "   • Application:    $APP_DIR"
    echo "   • AC Server:      $AC_SERVER_DIR"
    echo "   • Data/Logs:      $APP_DIR/backend/data"
    echo ""
    
    if [ "$USE_DOCKER" = "yes" ]; then
        echo "🐳 Docker Commands:"
        echo "   • View logs:      docker-compose logs -f"
        echo "   • Restart:        docker-compose restart"
        echo "   • Stop:           docker-compose stop"
        echo "   • Start:          docker-compose start"
    else
        echo "🔧 PM2 Commands:"
        echo "   • View logs:      pm2 logs ac-server-manager"
        echo "   • Restart:        pm2 restart ac-server-manager"
        echo "   • Stop:           pm2 stop ac-server-manager"
        echo "   • Start:          pm2 start ac-server-manager"
    fi
    
    echo ""
    echo "📚 Next Steps:"
    echo "   1. Open http://$SERVER_IP:3001 in your browser"
    echo "   2. Complete the Setup Wizard (if needed)"
    echo "   3. Configure your first server"
    echo "   4. Start racing! 🏁"
    echo ""
    
    print_info "For help: https://github.com/Brewsker/ac-server-manager"
    echo ""
}

###############################################################################
# Main Installation Flow
###############################################################################

main() {
    show_welcome
    
    check_root
    check_os
    ensure_wget_or_curl
    
    # Interactive prompts
    prompt_installation_type
    prompt_ac_server
    prompt_installation_dir
    confirm_installation
    
    echo ""
    print_header "Starting Installation"
    
    # System setup
    install_system_packages
    
    if [ "$USE_DOCKER" = "yes" ]; then
        install_docker
    else
        install_nodejs
        install_pm2
    fi
    
    # AC Server setup
    if [ "$INSTALL_AC_SERVER" = "yes" ]; then
        install_steamcmd
        download_ac_server
    fi
    
    # Application setup
    install_application
    
    if [ "$USE_DOCKER" = "yes" ]; then
        # Docker handles dependencies internally
        configure_application
        setup_docker_service
    else
        install_dependencies
        configure_application
        setup_pm2_service
    fi
    
    # Finalization
    setup_firewall
    run_health_check
    
    # Success!
    show_completion
}

# Run main installation
main "$@"

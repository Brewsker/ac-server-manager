#!/bin/bash
###############################################################################
# Setup Wizard Testing Script
# Run this script on the Proxmox host to test the wizard flow
###############################################################################

CTID=999
AC_SERVER_DIR="/opt/assetto-corsa-server"
APP_DIR="/opt/ac-server-manager"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Get container IP
get_container_ip() {
    pct exec $CTID -- hostname -I | awk '{print $1}'
}

# Test 1: Check current setup status
test_setup_status() {
    print_header "Test 1: Check Setup Status"
    
    IP=$(get_container_ip)
    print_info "Testing http://$IP:3001/api/setup/status"
    
    result=$(pct exec $CTID -- curl -s http://localhost:3001/api/setup/status)
    echo "$result" | jq '.' 2>/dev/null || echo "$result"
    
    configured=$(echo "$result" | jq -r '.configured' 2>/dev/null)
    
    if [ "$configured" == "true" ]; then
        print_success "Setup is configured - should show main app"
    else
        print_success "Setup is NOT configured - should show wizard"
    fi
}

# Test 2: Create mock AC server for testing
create_mock_ac_server() {
    print_header "Test 2: Create Mock AC Server"
    
    print_info "Creating mock AC server structure at $AC_SERVER_DIR"
    
    pct exec $CTID -- bash -c "
        mkdir -p $AC_SERVER_DIR/server/cfg
        mkdir -p $AC_SERVER_DIR/content/cars
        mkdir -p $AC_SERVER_DIR/content/tracks
        
        # Create dummy server executable
        echo '#!/bin/bash' > $AC_SERVER_DIR/server/acServer.exe
        echo 'echo AC Server Mock' >> $AC_SERVER_DIR/server/acServer.exe
        chmod +x $AC_SERVER_DIR/server/acServer.exe
        
        # Create mock config
        cat > $AC_SERVER_DIR/server/cfg/server_cfg.ini << 'EOF'
[SERVER]
NAME=Test Server
ADMIN_PASSWORD=admin123
CARS=ks_audi_r8_plus
TRACK=ks_vallelunga-club
MAX_CLIENTS=24
EOF
        
        # Create mock entry list
        cat > $AC_SERVER_DIR/server/cfg/entry_list.ini << 'EOF'
[CAR_0]
MODEL=ks_audi_r8_plus
SKIN=white
SPECTATOR_MODE=0
DRIVERNAME=TestDriver
TEAM=
GUID=
BALLAST=0
EOF
        
        echo 'Mock AC Server created'
    "
    
    print_success "Mock AC server created at $AC_SERVER_DIR"
    
    # Verify files
    print_info "Verifying files..."
    pct exec $CTID -- ls -la $AC_SERVER_DIR/server/acServer.exe
    pct exec $CTID -- ls -la $AC_SERVER_DIR/server/cfg/server_cfg.ini
    pct exec $CTID -- ls -la $AC_SERVER_DIR/server/cfg/entry_list.ini
    pct exec $CTID -- ls -la $AC_SERVER_DIR/content
}

# Test 3: Test validation endpoint
test_validation() {
    print_header "Test 3: Test Validation Endpoint"
    
    print_info "Testing validation with path: $AC_SERVER_DIR"
    
    result=$(pct exec $CTID -- curl -s -X POST http://localhost:3001/api/setup/validate \
        -H "Content-Type: application/json" \
        -d "{\"path\":\"$AC_SERVER_DIR\"}")
    
    echo "$result" | jq '.' 2>/dev/null || echo "$result"
    
    valid=$(echo "$result" | jq -r '.valid' 2>/dev/null)
    
    if [ "$valid" == "true" ]; then
        print_success "Validation PASSED"
        echo "$result" | jq -r '.paths' 2>/dev/null
    else
        print_error "Validation FAILED"
        echo "$result" | jq -r '.errors[]' 2>/dev/null
    fi
}

# Test 4: Save configuration
save_configuration() {
    print_header "Test 4: Save Configuration"
    
    print_info "Saving configuration with path: $AC_SERVER_DIR"
    
    result=$(pct exec $CTID -- curl -s -X POST http://localhost:3001/api/setup/configure \
        -H "Content-Type: application/json" \
        -d "{\"path\":\"$AC_SERVER_DIR\"}")
    
    echo "$result" | jq '.' 2>/dev/null || echo "$result"
    
    success=$(echo "$result" | jq -r '.success' 2>/dev/null)
    
    if [ "$success" == "true" ]; then
        print_success "Configuration saved successfully"
    else
        print_error "Failed to save configuration"
    fi
    
    # Show .env file
    print_info "Updated .env file:"
    pct exec $CTID -- grep "^AC_" $APP_DIR/backend/.env
}

# Test 5: Verify configuration persistence
test_persistence() {
    print_header "Test 5: Test Configuration Persistence"
    
    print_info "Restarting PM2 service..."
    pct exec $CTID -- pm2 restart ac-server-manager
    
    sleep 3
    
    print_info "Checking setup status after restart..."
    result=$(pct exec $CTID -- curl -s http://localhost:3001/api/setup/status)
    
    echo "$result" | jq '.' 2>/dev/null || echo "$result"
    
    configured=$(echo "$result" | jq -r '.configured' 2>/dev/null)
    
    if [ "$configured" == "true" ]; then
        print_success "Configuration persisted after restart"
    else
        print_error "Configuration did NOT persist"
    fi
}

# Test 6: Reset configuration (clear .env)
reset_configuration() {
    print_header "Test 6: Reset Configuration"
    
    print_info "Backing up current .env..."
    pct exec $CTID -- cp $APP_DIR/backend/.env $APP_DIR/backend/.env.backup
    
    print_info "Resetting .env to example..."
    pct exec $CTID -- cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
    
    print_info "Restarting service..."
    pct exec $CTID -- pm2 restart ac-server-manager
    
    sleep 3
    
    print_info "Checking status after reset..."
    result=$(pct exec $CTID -- curl -s http://localhost:3001/api/setup/status)
    
    echo "$result" | jq '.' 2>/dev/null || echo "$result"
    
    configured=$(echo "$result" | jq -r '.configured' 2>/dev/null)
    
    if [ "$configured" == "false" ]; then
        print_success "Configuration successfully reset - wizard should appear"
    else
        print_error "Configuration still shows as configured"
    fi
}

# Test 7: Restore configuration
restore_configuration() {
    print_header "Test 7: Restore Configuration"
    
    if pct exec $CTID -- test -f $APP_DIR/backend/.env.backup; then
        print_info "Restoring backed up .env..."
        pct exec $CTID -- mv $APP_DIR/backend/.env.backup $APP_DIR/backend/.env
        
        print_info "Restarting service..."
        pct exec $CTID -- pm2 restart ac-server-manager
        
        sleep 3
        print_success "Configuration restored"
    else
        print_error "No backup found to restore"
    fi
}

# Test 8: Check PM2 logs
check_logs() {
    print_header "PM2 Logs (Last 30 lines)"
    
    pct exec $CTID -- pm2 logs ac-server-manager --lines 30 --nostream
}

# Test 9: Show URLs
show_access_info() {
    print_header "Access Information"
    
    IP=$(get_container_ip)
    
    echo "📍 Container Information:"
    echo "   ID:              $CTID"
    echo "   IP Address:      $IP"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Web Interface:   http://$IP:3001"
    echo "   Setup API:       http://$IP:3001/api/setup/status"
    echo "   Health Check:    http://$IP:3001/health"
    echo ""
    echo "📂 Paths:"
    echo "   Application:     $APP_DIR"
    echo "   AC Server:       $AC_SERVER_DIR"
    echo "   .env File:       $APP_DIR/backend/.env"
    echo ""
    echo "🔧 Commands:"
    echo "   Enter container: pct enter $CTID"
    echo "   View PM2 logs:   pct exec $CTID -- pm2 logs ac-server-manager"
    echo "   PM2 status:      pct exec $CTID -- pm2 status"
}

# Menu
show_menu() {
    echo ""
    print_header "Setup Wizard Testing Menu"
    echo "1)  Check Setup Status"
    echo "2)  Create Mock AC Server"
    echo "3)  Test Validation Endpoint"
    echo "4)  Save Configuration"
    echo "5)  Test Persistence (Restart)"
    echo "6)  Reset Configuration (Show Wizard)"
    echo "7)  Restore Configuration"
    echo "8)  View PM2 Logs"
    echo "9)  Show Access Info"
    echo ""
    echo "10) Run Full Test Suite"
    echo "11) Quick Setup (Mock + Save)"
    echo ""
    echo "0)  Exit"
    echo ""
}

# Run full test suite
run_full_suite() {
    print_header "Running Full Test Suite"
    
    test_setup_status
    create_mock_ac_server
    test_validation
    save_configuration
    test_persistence
    
    print_header "All Tests Complete!"
    show_access_info
}

# Quick setup
quick_setup() {
    print_header "Quick Setup - Mock AC + Save Config"
    
    create_mock_ac_server
    sleep 1
    save_configuration
    sleep 1
    test_setup_status
    
    print_success "Quick setup complete!"
    show_access_info
}

# Main loop
main() {
    while true; do
        show_menu
        read -p "Select option [0-11]: " choice
        
        case $choice in
            1) test_setup_status ;;
            2) create_mock_ac_server ;;
            3) test_validation ;;
            4) save_configuration ;;
            5) test_persistence ;;
            6) reset_configuration ;;
            7) restore_configuration ;;
            8) check_logs ;;
            9) show_access_info ;;
            10) run_full_suite ;;
            11) quick_setup ;;
            0) 
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
        
        read -p "Press Enter to continue..."
    done
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Install with: apt-get install jq"
    exit 1
fi

# Check if container exists
if ! pct status $CTID &>/dev/null; then
    print_error "Container $CTID does not exist"
    exit 1
fi

# Check if container is running
if ! pct status $CTID | grep -q "running"; then
    print_info "Starting container $CTID..."
    pct start $CTID
    sleep 3
fi

# Run main menu
if [ "$1" == "auto" ]; then
    run_full_suite
elif [ "$1" == "quick" ]; then
    quick_setup
else
    main
fi

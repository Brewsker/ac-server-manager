#!/bin/bash
###############################################################################
# Proxmox Test Container Manager
# 
# Quickly create/destroy/rebuild test containers for AC Server Manager installer
# Run this ON THE PROXMOX HOST (not inside the container)
#
# Usage:
#   ./test-proxmox.sh create   - Create new test container
#   ./test-proxmox.sh destroy  - Destroy test container
#   ./test-proxmox.sh rebuild  - Destroy and recreate in one command
#   ./test-proxmox.sh enter    - Enter the container shell
###############################################################################

CTID=999
HOSTNAME="ac-test"
PASSWORD="TestPass123"
CORES=2
MEMORY=4096
DISK=60
STORAGE="local-lvm"
TEMPLATE="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"

print_info() {
    echo -e "\033[0;34mℹ️  $1\033[0m"
}

print_success() {
    echo -e "\033[0;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[0;31m❌ $1\033[0m"
}

create_container() {
    print_info "Creating test container $CTID..."
    
    # Check if container already exists
    if pct status $CTID &>/dev/null; then
        print_error "Container $CTID already exists. Use 'destroy' first or 'rebuild'."
        exit 1
    fi
    
    # Create container
    pct create $CTID $TEMPLATE \
        --hostname $HOSTNAME \
        --password $PASSWORD \
        --cores $CORES \
        --memory $MEMORY \
        --rootfs $STORAGE:$DISK \
        --net0 name=eth0,bridge=vmbr0,ip=dhcp \
        --features nesting=1,keyctl=1 \
        --start 1 \
        --unprivileged 1
    
    print_success "Container created and started"
    
    # Wait for container to be ready
    sleep 5
    
    # Install bootstrap packages
    print_info "Installing bootstrap packages (curl, Node.js)..."
    if ! pct exec $CTID -- apt-get update -qq 2>&1; then
        print_error "Failed to update package lists"
        exit 1
    fi
    
    if ! pct exec $CTID -- apt-get install -y curl 2>&1 | grep -q "Setting up curl"; then
        print_error "Failed to install curl"
        exit 1
    fi
    
    # Install Node.js 20 for setup wizard
    pct exec $CTID -- bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs" > /dev/null 2>&1
    print_success "Bootstrap packages installed"
    
    # Get IP address
    IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')
    print_success "Container IP: $IP"
    
    # Download setup wizard files
    print_info "Setting up web-based installation wizard..."
    pct exec $CTID -- bash -c "mkdir -p /opt/ac-setup && cd /opt/ac-setup && curl -fsSL https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/setup-wizard.html -o setup-wizard.html && curl -fsSL https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/setup-server.js -o setup-server.js"
    
    # Download and install systemd service
    print_info "Installing setup wizard service..."
    pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/ac-setup-wizard.service -o /etc/systemd/system/ac-setup-wizard.service"
    
    # Start setup wizard service
    pct exec $CTID -- bash -c "systemctl daemon-reload && systemctl start ac-setup-wizard && systemctl is-active ac-setup-wizard"
    sleep 2
    
    echo ""
    print_success "Setup wizard ready!"
    print_info "Open http://$IP:3001 in your browser to complete installation"
    
    print_info "Container Details:"
    echo "  ID:       $CTID"
    echo "  Hostname: $HOSTNAME"
    echo "  IP:       $IP"
    echo "  Password: $PASSWORD"
    echo ""
    print_info "Enter container with: pct enter $CTID"
    print_info "Or use: ./test-proxmox.sh enter"
}

destroy_container() {
    print_info "Destroying test container $CTID..."
    
    # Check if container exists
    if ! pct status $CTID &>/dev/null; then
        print_error "Container $CTID does not exist"
        exit 1
    fi
    
    # Stop if running
    if pct status $CTID | grep -q "running"; then
        print_info "Stopping container..."
        pct stop $CTID
        sleep 2
    fi
    
    # Destroy container
    pct destroy $CTID
    
    print_success "Container destroyed"
}

rebuild_container() {
    print_info "Rebuilding test container..."
    echo ""
    
    # Destroy if exists
    if pct status $CTID &>/dev/null; then
        destroy_container
        echo ""
    fi
    
    # Create new
    create_container
}

enter_container() {
    # Check if container exists
    if ! pct status $CTID &>/dev/null; then
        print_error "Container $CTID does not exist. Create it first with: ./test-proxmox.sh create"
        exit 1
    fi
    
    # Start if not running
    if ! pct status $CTID | grep -q "running"; then
        print_info "Starting container..."
        pct start $CTID
        sleep 2
    fi
    
    print_info "Entering container $CTID..."
    pct enter $CTID
}

case "$1" in
    create)
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
    *)
        echo "Proxmox Test Container Manager"
        echo ""
        echo "Usage: $0 {create|destroy|rebuild|enter}"
        echo ""
        echo "Commands:"
        echo "  create   - Create new test container (ID $CTID)"
        echo "  destroy  - Destroy test container"
        echo "  rebuild  - Destroy and recreate (quick reset)"
        echo "  enter    - Enter container shell"
        echo ""
        echo "Current container ID: $CTID"
        if pct status $CTID &>/dev/null; then
            echo "Status: $(pct status $CTID)"
        else
            echo "Status: Not created"
        fi
        exit 1
        ;;
esac

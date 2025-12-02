#!/bin/bash
###############################################################################
# SSH Manager - Robust SSH Key and Container Password Handler
# 
# Provides bulletproof SSH access to Proxmox containers with:
# - Automatic SSH key injection
# - Known_hosts management
# - Password configuration
# - Container metadata tracking
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_METADATA="$SCRIPT_DIR/.container-metadata.json"
DEFAULT_PASSWORD="${CONTAINER_PASSWORD:-admin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

###############################################################################
# SSH Key Management
###############################################################################

get_ssh_public_key() {
    # Try to find SSH public key in common locations
    local key_locations=(
        "$HOME/.ssh/id_rsa.pub"
        "$HOME/.ssh/id_ed25519.pub"
        "$HOME/.ssh/id_ecdsa.pub"
    )
    
    for key in "${key_locations[@]}"; do
        if [ -f "$key" ]; then
            cat "$key"
            return 0
        fi
    done
    
    log_error "No SSH public key found in ~/.ssh/"
    log_info "Generate one with: ssh-keygen -t ed25519 -C 'your_email@example.com'"
    return 1
}

inject_ssh_key_to_container() {
    local ctid=$1
    local ssh_key=$2
    
    if [ -z "$ssh_key" ]; then
        ssh_key=$(get_ssh_public_key) || return 1
    fi
    
    log_info "Injecting SSH key into container $ctid..."
    
    # Create .ssh directory if it doesn't exist
    pct exec "$ctid" -- bash -c "mkdir -p /root/.ssh && chmod 700 /root/.ssh"
    
    # Add SSH key to authorized_keys
    pct exec "$ctid" -- bash -c "echo '$ssh_key' >> /root/.ssh/authorized_keys"
    
    # Set correct permissions
    pct exec "$ctid" -- bash -c "chmod 600 /root/.ssh/authorized_keys"
    
    # Remove duplicates
    pct exec "$ctid" -- bash -c "sort -u /root/.ssh/authorized_keys -o /root/.ssh/authorized_keys"
    
    log_success "SSH key injected into container $ctid"
}

remove_known_host() {
    local host=$1
    
    if [ -f "$HOME/.ssh/known_hosts" ]; then
        ssh-keygen -R "$host" &>/dev/null || true
        log_info "Removed old SSH key for $host"
    fi
}

###############################################################################
# Container Password Management
###############################################################################

set_container_password() {
    local ctid=$1
    local password=$2
    
    if [ -z "$password" ]; then
        password="$DEFAULT_PASSWORD"
    fi
    
    log_info "Setting password for container $ctid..."
    
    # Set root password
    pct exec "$ctid" -- bash -c "echo 'root:$password' | chpasswd"
    
    log_success "Password set for container $ctid"
}

###############################################################################
# Container Metadata Management
###############################################################################

save_container_metadata() {
    local ctid=$1
    local ip=$2
    local name=$3
    local password=$4
    
    # Create metadata file if it doesn't exist
    if [ ! -f "$CONTAINER_METADATA" ]; then
        echo '{}' > "$CONTAINER_METADATA"
    fi
    
    # Update metadata using jq if available, otherwise use simple echo
    if command -v jq &>/dev/null; then
        local temp=$(mktemp)
        jq --arg id "$ctid" \
           --arg ip "$ip" \
           --arg name "$name" \
           --arg pass "$password" \
           '.[$id] = {ip: $ip, name: $name, password: $pass, updated: now|strftime("%Y-%m-%d %H:%M:%S")}' \
           "$CONTAINER_METADATA" > "$temp"
        mv "$temp" "$CONTAINER_METADATA"
    else
        # Fallback: simple JSON (overwrites for that container)
        cat > "$CONTAINER_METADATA" << EOF
{
  "$ctid": {
    "ip": "$ip",
    "name": "$name",
    "password": "$password",
    "updated": "$(date '+%Y-%m-%d %H:%M:%S')"
  }
}
EOF
    fi
    
    log_success "Metadata saved for container $ctid"
}

get_container_ip() {
    local ctid=$1
    
    # Try to get from metadata first
    if [ -f "$CONTAINER_METADATA" ] && command -v jq &>/dev/null; then
        local ip=$(jq -r ".\"$ctid\".ip // empty" "$CONTAINER_METADATA")
        if [ -n "$ip" ]; then
            echo "$ip"
            return 0
        fi
    fi
    
    # Fallback: get from pct
    pct exec "$ctid" -- hostname -I | awk '{print $1}'
}

###############################################################################
# SSH Connection Helpers
###############################################################################

ssh_container() {
    local ctid=$1
    shift
    local command="$@"
    
    local ip=$(get_container_ip "$ctid")
    
    if [ -z "$ip" ]; then
        log_error "Cannot determine IP for container $ctid"
        return 1
    fi
    
    # Clean known_hosts
    remove_known_host "$ip"
    
    # Execute SSH command
    if [ -n "$command" ]; then
        ssh -o StrictHostKeyChecking=accept-new root@"$ip" "$command"
    else
        ssh -o StrictHostKeyChecking=accept-new root@"$ip"
    fi
}

###############################################################################
# Main Setup Function
###############################################################################

setup_container_ssh() {
    local ctid=$1
    local ip=$2
    local name=$3
    local password=${4:-$DEFAULT_PASSWORD}
    
    log_info "Setting up SSH for container $ctid ($name) at $ip"
    
    # Set password
    set_container_password "$ctid" "$password"
    
    # Inject SSH key
    inject_ssh_key_to_container "$ctid"
    
    # Clean known_hosts
    remove_known_host "$ip"
    
    # Save metadata
    save_container_metadata "$ctid" "$ip" "$name" "$password"
    
    log_success "SSH setup complete for container $ctid"
    log_info "Test with: ssh root@$ip"
}

###############################################################################
# CLI Commands
###############################################################################

show_usage() {
    cat << EOF
${CYAN}SSH Manager - Robust SSH and Password Management for Containers${NC}

Usage: $0 <command> [options]

Commands:
  ${GREEN}setup <ctid> <ip> <name> [password]${NC}
    Setup SSH keys and password for a container
    Example: $0 setup 999 192.168.1.71 ac-test admin

  ${GREEN}inject-key <ctid>${NC}
    Inject your SSH public key into a container
    Example: $0 inject-key 999

  ${GREEN}set-password <ctid> [password]${NC}
    Set container root password (defaults to: $DEFAULT_PASSWORD)
    Example: $0 set-password 999 mypassword

  ${GREEN}clean-host <ip>${NC}
    Remove SSH known_host entry for an IP
    Example: $0 clean-host 192.168.1.71

  ${GREEN}ssh <ctid> [command]${NC}
    SSH into container (auto-cleans known_hosts)
    Example: $0 ssh 999
    Example: $0 ssh 999 "pm2 list"

  ${GREEN}get-ip <ctid>${NC}
    Get container IP address
    Example: $0 get-ip 999

  ${GREEN}list${NC}
    List all managed containers
    Example: $0 list

Environment Variables:
  CONTAINER_PASSWORD    Default password for containers (default: admin)

Examples:
  # Full setup for new container
  $0 setup 999 192.168.1.71 ac-test

  # Just inject SSH key
  $0 inject-key 999

  # SSH into container
  $0 ssh 999

  # Run command in container
  $0 ssh 999 "pm2 list"

EOF
}

###############################################################################
# Main
###############################################################################

case "${1:-}" in
    setup)
        if [ $# -lt 3 ]; then
            log_error "Usage: $0 setup <ctid> <ip> <name> [password]"
            exit 1
        fi
        setup_container_ssh "$2" "$3" "$4" "${5:-}"
        ;;
    
    inject-key)
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 inject-key <ctid>"
            exit 1
        fi
        inject_ssh_key_to_container "$2"
        ;;
    
    set-password)
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 set-password <ctid> [password]"
            exit 1
        fi
        set_container_password "$2" "${3:-}"
        ;;
    
    clean-host)
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 clean-host <ip>"
            exit 1
        fi
        remove_known_host "$2"
        ;;
    
    ssh)
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 ssh <ctid> [command]"
            exit 1
        fi
        shift
        ssh_container "$@"
        ;;
    
    get-ip)
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 get-ip <ctid>"
            exit 1
        fi
        get_container_ip "$2"
        ;;
    
    list)
        if [ -f "$CONTAINER_METADATA" ]; then
            if command -v jq &>/dev/null; then
                jq -r 'to_entries[] | "\(.key)\t\(.value.name)\t\(.value.ip)\t\(.value.updated)"' "$CONTAINER_METADATA" | \
                    awk 'BEGIN {printf "%-8s %-20s %-15s %s\n", "CT ID", "Name", "IP", "Updated"} {printf "%-8s %-20s %-15s %s\n", $1, $2, $3, $4" "$5}'
            else
                cat "$CONTAINER_METADATA"
            fi
        else
            log_warning "No container metadata found"
        fi
        ;;
    
    *)
        show_usage
        exit 1
        ;;
esac

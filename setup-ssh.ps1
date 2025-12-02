#!/usr/bin/env pwsh
###############################################################################
# SSH Setup and Maintenance Script for Windows
# Ensures password-less SSH access to AC Server Manager containers
###############################################################################

$ErrorActionPreference = "Stop"

$SSH_DIR = "$env:USERPROFILE\.ssh"
$CONFIG_FILE = "$SSH_DIR\config"
$BACKUP_DIR = ".\ssh-backups"
$PROJECT_SSH_CONFIG = ".\.ssh-config"

# Colors
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

###############################################################################
# SSH Key Management
###############################################################################

function Ensure-SSHKeys {
    Write-Info "Checking SSH keys..."
    
    if (!(Test-Path "$SSH_DIR\id_ed25519.pub")) {
        Write-Info "Generating ED25519 SSH key..."
        ssh-keygen -t ed25519 -f "$SSH_DIR\id_ed25519" -N '""' -C "brook@ac-server-manager"
        Write-Success "SSH key generated"
    } else {
        Write-Success "SSH keys exist"
    }
}

function Backup-SSHConfig {
    Write-Info "Backing up SSH configuration..."
    
    if (!(Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    
    if (Test-Path $CONFIG_FILE) {
        Copy-Item $CONFIG_FILE "$BACKUP_DIR\config-$timestamp.bak"
        Write-Success "SSH config backed up to $BACKUP_DIR\config-$timestamp.bak"
    }
}

function Restore-SSHConfig {
    Write-Info "Restoring SSH configuration from project..."
    
    Backup-SSHConfig
    
    if (Test-Path $PROJECT_SSH_CONFIG) {
        Copy-Item $PROJECT_SSH_CONFIG $CONFIG_FILE -Force
        Write-Success "SSH config restored from $PROJECT_SSH_CONFIG"
    } else {
        Write-Error "Project SSH config not found at $PROJECT_SSH_CONFIG"
        exit 1
    }
}

function Inject-SSHKey {
    param(
        [string]$Host,
        [string]$Password = "admin"
    )
    
    Write-Info "Injecting SSH key into $Host..."
    
    $pubkey = Get-Content "$SSH_DIR\id_ed25519.pub"
    
    # Use password authentication one time to inject the key
    $command = "mkdir -p ~/.ssh && echo '$pubkey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys && echo 'Key injected'"
    
    Write-Info "This will ask for password once (default: admin)"
    ssh root@$Host $command
    
    Write-Success "SSH key injected into $Host"
}

function Test-SSHConnection {
    param([string]$Host)
    
    Write-Info "Testing SSH connection to $Host..."
    
    try {
        $result = ssh root@$Host "echo 'SSH works'" 2>&1
        if ($result -match "SSH works") {
            Write-Success "Password-less SSH working for $Host"
            return $true
        } else {
            Write-Warning "SSH connection failed for $Host"
            return $false
        }
    } catch {
        Write-Warning "SSH connection failed for $Host"
        return $false
    }
}

function Clean-KnownHosts {
    param([string]$Host)
    
    Write-Info "Cleaning known_hosts for $Host..."
    ssh-keygen -R $Host 2>&1 | Out-Null
    Write-Success "Removed old host key for $Host"
}

###############################################################################
# Main Commands
###############################################################################

function Show-Usage {
    Write-Host @"

SSH Setup and Maintenance Script

Usage: .\setup-ssh.ps1 <command>

Commands:
  setup              - Full SSH setup (keys + config + injection)
  restore            - Restore SSH config from project file
  backup             - Backup current SSH config
  inject <host>      - Inject SSH key into host (one-time password)
  test <host>        - Test password-less SSH to host
  clean <host>       - Clean known_hosts entry for host
  verify             - Verify all configured hosts

Examples:
  .\setup-ssh.ps1 setup
  .\setup-ssh.ps1 inject 192.168.1.71
  .\setup-ssh.ps1 test 192.168.1.71
  .\setup-ssh.ps1 verify

"@
}

function Setup-All {
    Write-Info "Starting full SSH setup..."
    
    # Ensure SSH keys exist
    Ensure-SSHKeys
    
    # Restore SSH config
    Restore-SSHConfig
    
    Write-Success "SSH setup complete!"
    Write-Info "To enable password-less SSH to containers, run:"
    Write-Info "  .\setup-ssh.ps1 inject 192.168.1.71"
}

function Verify-All {
    Write-Info "Verifying SSH access to all hosts..."
    
    $hosts = @("192.168.1.71", "192.168.1.70")
    $results = @{}
    
    foreach ($host in $hosts) {
        $results[$host] = Test-SSHConnection -Host $host
    }
    
    Write-Host "`nResults:"
    foreach ($host in $results.Keys) {
        if ($results[$host]) {
            Write-Success "$host - Working"
        } else {
            Write-Warning "$host - Failed (run: .\setup-ssh.ps1 inject $host)"
        }
    }
}

###############################################################################
# Main
###############################################################################

$command = $args[0]

switch ($command) {
    "setup" {
        Setup-All
    }
    "restore" {
        Restore-SSHConfig
    }
    "backup" {
        Backup-SSHConfig
    }
    "inject" {
        if ($args.Count -lt 2) {
            Write-Error "Usage: .\setup-ssh.ps1 inject <host>"
            exit 1
        }
        Inject-SSHKey -Host $args[1]
    }
    "test" {
        if ($args.Count -lt 2) {
            Write-Error "Usage: .\setup-ssh.ps1 test <host>"
            exit 1
        }
        Test-SSHConnection -Host $args[1]
    }
    "clean" {
        if ($args.Count -lt 2) {
            Write-Error "Usage: .\setup-ssh.ps1 clean <host>"
            exit 1
        }
        Clean-KnownHosts -Host $args[1]
    }
    "verify" {
        Verify-All
    }
    default {
        Show-Usage
        exit 1
    }
}

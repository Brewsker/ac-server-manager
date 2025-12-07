# Scripts Directory

Organized scripts for development, deployment, and server management.

## Directory Structure

```
scripts/
├── deploy-to-proxmox.ps1       # Production deployment
├── rollback-deployment.ps1     # Rollback to previous version
├── bump-version.ps1            # Version management
├── commit.ps1                  # Git commit helper
├── fix-pm2-env.sh             # Fix PM2 environment variables
├── update-wizard.sh           # Update wizard utilities
├── install/                   # Installation scripts
│   ├── install-proxmox.sh
│   ├── install-proxmox-unified.sh
│   ├── install-server.sh
│   ├── install.ps1
│   └── setup-server.js
├── testing/                   # Test scripts
│   ├── test-proxmox.sh
│   ├── test-proxmox-dev.sh
│   ├── test-fresh-install.sh
│   └── test-wizard-flow.sh
└── ssh/                       # SSH management
    ├── setup-ssh.ps1
    ├── ssh-manager.sh
    ├── SSH-README.md
    ├── .ssh-config
    └── ssh-backups/
```

## Main Scripts

### Deployment

- **`deploy-to-proxmox.ps1`** - Deploy app to production container

  ```powershell
  .\scripts\deploy-to-proxmox.ps1              # Full deployment
  .\scripts\deploy-to-proxmox.ps1 -SkipBuild   # Skip build step
  .\scripts\deploy-to-proxmox.ps1 -SkipBackup  # Skip backup
  ```

- **`rollback-deployment.ps1`** - Restore previous deployment
  ```powershell
  .\scripts\rollback-deployment.ps1 -ListOnly  # List backups
  .\scripts\rollback-deployment.ps1            # Rollback to latest
  ```

### Development

- **`bump-version.ps1`** - Increment version numbers
- **`commit.ps1`** - Quick commit with conventional format

### Maintenance

- **`fix-pm2-env.sh`** - Fix PM2 environment variables after updates
- **`update-wizard.sh`** - Wizard update utilities

## Installation Scripts (`install/`)

Scripts for setting up AC Server Manager on various platforms:

- **`install-proxmox-unified.sh`** - Primary Proxmox LXC installer (automated container creation)
- **`install-server.sh`** - Bare metal/inside container installer (called by unified)
- **`install.ps1`** - Windows installation (experimental)
- **`setup-server.js`** - Setup wizard server component

## Testing Scripts (`testing/`)

Scripts for testing installations and functionality:

- **`test-proxmox.sh`** - Test Proxmox deployment
- **`test-proxmox-dev.sh`** - Development testing
- **`test-fresh-install.sh`** - Test clean installation
- **`test-wizard-flow.sh`** - Test setup wizard flow

## SSH Scripts (`ssh/`)

SSH configuration and management tools:

- **`setup-ssh.ps1`** - Configure SSH for deployment
- **`ssh-manager.sh`** - Manage SSH connections
- **`SSH-README.md`** - SSH setup documentation

## Usage Examples

### Deploy a new version

```powershell
# Build and deploy with backup
.\scripts\deploy-to-proxmox.ps1

# Quick redeploy (no build, no backup)
.\scripts\deploy-to-proxmox.ps1 -SkipBuild -SkipBackup
```

### Rollback if something breaks

```powershell
# See what backups are available
.\scripts\rollback-deployment.ps1 -ListOnly

# Rollback to most recent
.\scripts\rollback-deployment.ps1
```

### Fresh installation

```bash
# On Proxmox host
./scripts/install/install-proxmox-unified.sh

# On Linux server
./scripts/install/install-server.sh
```

## Best Practices

1. **Always backup before deployment** - Use default deployment (includes backup)
2. **Test in dev container first** - Use testing scripts before production
3. **Keep SSH configs secure** - SSH files are gitignored
4. **Document script changes** - Update this README when adding scripts

## Maintenance

- Review and update scripts quarterly
- Remove unused scripts to `/deprecated/`
- Keep installation scripts up-to-date with dependencies
- Test deployment scripts before major releases

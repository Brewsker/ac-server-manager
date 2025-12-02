# SSH Configuration - DO NOT MODIFY MANUALLY

This directory contains SSH configuration backups and maintenance tools.

## Current Status
- ✅ Password-less SSH working for 192.168.1.71 (ac-server)
- ✅ SSH key: `~/.ssh/id_ed25519` injected into containers

## Files
- `.ssh-config` - Master SSH config (version controlled)
- `setup-ssh.ps1` - PowerShell maintenance script
- `ssh-backups/` - Automatic config backups

## Usage

### Verify SSH is working:
```powershell
.\setup-ssh.ps1 verify
```

### Restore SSH config (if broken):
```powershell
.\setup-ssh.ps1 restore
```

### Inject SSH key into new container:
```powershell
.\setup-ssh.ps1 inject 192.168.1.71
```

### Test specific host:
```powershell
.\setup-ssh.ps1 test 192.168.1.71
```

## Recovery

If SSH stops working:

1. Run restore:
   ```powershell
   .\setup-ssh.ps1 restore
   ```

2. Clean known_hosts:
   ```powershell
   .\setup-ssh.ps1 clean 192.168.1.71
   ```

3. Re-inject key (requires password once):
   ```powershell
   .\setup-ssh.ps1 inject 192.168.1.71
   ```

## Maintenance

The SSH config is version controlled. After any changes to `.ssh-config`, commit:

```bash
git add .ssh-config setup-ssh.ps1
git commit -m "Update SSH configuration"
```

## Troubleshooting

**SSH asks for password:**
- Run: `.\setup-ssh.ps1 inject 192.168.1.71`

**"Host key verification failed":**
- Run: `.\setup-ssh.ps1 clean 192.168.1.71`

**Config corrupted:**
- Run: `.\setup-ssh.ps1 restore`

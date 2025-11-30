# Cleanup & Restart Guide

## Quick Cleanup Options

### Option 1: VS Code Task (Recommended)
1. Press `Ctrl+Shift+P`
2. Type "Run Task"
3. Select `🔴 Kill All Terminals & Processes`
4. After it completes, press `Ctrl+Shift+K` to close all terminal tabs
5. Run task `🚀 Start Both Services` to restart

### Option 2: One-Click Hard Reset
1. Press `Ctrl+Shift+P`
2. Type "Run Task"
3. Select `🔴 Hard Reset - Kill All & Restart`
4. Manually close terminal tabs with `Ctrl+Shift+P` -> "Terminal: Kill All Terminals"

### Option 3: PowerShell Script
Run from workspace root:
```powershell
.\cleanup.ps1
```

### Option 4: Admin Cleanup (for stuck processes)
Right-click `admin-reset.ps1` -> Run with PowerShell (as Administrator)

## Manual Cleanup Steps

If automated cleanup fails:

1. **Kill Node Processes:**
   ```powershell
   Get-Process -Name node,nodemon -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Release Ports:**
   ```powershell
   @(3001, 5173, 5174) | ForEach-Object {
       $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
       if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
   }
   ```

3. **Close All VS Code Terminals:**
   - Press `Ctrl+Shift+P`
   - Type "Terminal: Kill All Terminals"
   - Press Enter

4. **Verify Cleanup:**
   ```powershell
   Get-Process node -ErrorAction SilentlyContinue  # Should return nothing
   Get-NetTCPConnection -LocalPort 3001,5173,5174 -ErrorAction SilentlyContinue  # Should return nothing
   ```

## Keyboard Shortcuts

- `Ctrl+Shift+K` - Close all terminals
- `Ctrl+Shift+P` - Command palette
- `Ctrl+Shift+`` - New terminal

## Common Issues

### "Access Denied" when killing processes
- Run `admin-reset.ps1` as Administrator
- Or restart VS Code

### Ports still occupied after cleanup
- Check for other applications using the ports
- Restart your computer as last resort

### Backend crashes immediately
- Check `backend/error.log` for errors
- Verify `.env` configuration
- Check AC_CONTENT_PATH is valid

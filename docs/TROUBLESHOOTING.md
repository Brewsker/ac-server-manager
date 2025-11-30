# Troubleshooting

## Server Auto-Shutdown After ~30 Seconds

**Problem:** AC server starts successfully but shuts down after 5 failed lobby registration attempts with message "LOBBY COULD NOT BE REACHED, SHUTTING SERVER DOWN"

**Cause:** The AC server has `REGISTER_TO_LOBBY=1` in `server_cfg.ini`, which attempts to register with the official Assetto Corsa lobby server at `http://93.57.10.21/lobby.ashx`. This requires:
- Public internet access
- Port forwarding configured on your router
- Server accessible from the internet

**Solution:** For LAN/private servers, disable lobby registration:

### Option 1: Via Web UI (Coming Soon)
In the Server Configuration page, set "Register to Lobby" to OFF/0

### Option 2: Manual Edit
Edit `server_cfg.ini` and set:
```ini
REGISTER_TO_LOBBY=0
```

### Option 3: Via API
```bash
# Using the config API endpoint
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"SERVER": {"REGISTER_TO_LOBBY": 0, ...}}'
```

**Note:** With `REGISTER_TO_LOBBY=0`, your server will:
- ✅ Run continuously without auto-shutdown
- ✅ Be accessible via LAN (Direct Connection in AC)
- ✅ Support TCP and HTTP connections
- ❌ NOT appear in the AC public server browser

To connect to a LAN server in Assetto Corsa:
1. Go to Multiplayer
2. Click "Join"
3. Click "Direct Connection" tab
4. Enter your server IP and port (default: 9600)

## "Can't connect to remote server" in Assetto Corsa

**Problem:** Client shows "Game crashed - Can't connect to remote server"

**Possible Causes:**

### 1. Server Not Running
Check the AC Server Manager dashboard - server status should show "Running"

### 2. Wrong IP/Port
- Default port: 9600 (TCP)
- Use your server's local IP (e.g., 192.168.1.100)
- Don't use 127.0.0.1 from remote machines

### 3. Firewall Blocking
Windows Firewall may be blocking `acServer.exe`. Allow it through:
```powershell
New-NetFirewallRule -DisplayName "AC Server TCP" -Direction Inbound -Program "G:\SteamLibrary\steamapps\common\assettocorsa\server\acServer.exe" -Action Allow
New-NetFirewallRule -DisplayName "AC Server HTTP" -Direction Inbound -Program "G:\SteamLibrary\steamapps\common\assettocorsa\server\acServer.exe" -Action Allow -Protocol TCP -LocalPort 8081
```

### 4. Server Shut Down Due to Lobby Registration
See "Server Auto-Shutdown" section above

## Server Logs Show "open setups/bmw_m3_e30.ini: The system cannot find the file specified"

**Problem:** Warning messages about missing setup files

**Impact:** None - this is normal and harmless

**Explanation:** AC server looks for pre-configured car setups in the `setups/` folder. If not found, it uses default setups. Players can still join and use their own setups.

**Optional Fix:** Create setup files in `server/setups/` directory if you want to force specific setups

## Port Already in Use

**Problem:** Server won't start - port 9600 or 8081 already in use

**Solution:**
```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort 9600 | Select-Object -Property OwningProcess

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or change the port in server_cfg.ini
TCP_PORT=9601
HTTP_PORT=8082
```

## "Entry list has more clients than allowed by MAX_CLIENT"

**Problem:** Warning about too many entries in `entry_list.ini`

**Solution:** 
- Reduce entries in entry_list to match `MAX_CLIENTS` setting
- Or increase `MAX_CLIENTS` in server_cfg.ini
- Default is usually 18 clients

Example in server_cfg.ini:
```ini
MAX_CLIENTS=24
```

## Backend API Not Responding

**Problem:** Frontend can't connect to `http://localhost:3001`

**Solutions:**

### 1. Check if backend is running
```powershell
cd backend
npm run dev
```

### 2. Check port availability
```powershell
Test-NetConnection -ComputerName localhost -Port 3001
```

### 3. Check CORS settings
In `backend/.env`:
```
CORS_ORIGIN=http://localhost:5174
```

### 4. Restart both services
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Restart backend
cd backend; npm run dev

# Restart frontend (in new terminal)
cd frontend; npm run dev
```

## Module Not Found Errors

**Problem:** `Error: Cannot find module '...'`

**Solution:**
```powershell
# Reinstall dependencies
cd backend
Remove-Item node_modules -Recurse -Force
npm install

cd ..\frontend
Remove-Item node_modules -Recurse -Force
npm install
```

## Configuration Changes Not Taking Effect

**Problem:** Updated settings via UI but server behavior unchanged

**Cause:** Server needs restart to read new config

**Solution:** 
1. Stop the server via UI or API
2. Wait for status to show "Stopped"
3. Start the server again
4. Changes will be applied

**Note:** Some settings like `REGISTER_TO_LOBBY` only apply at server startup

## Best Practices

### Development
- Use `nodemon` in backend (auto-restarts on code changes)
- Use Vite HMR in frontend (auto-reloads on save)
- Keep terminal windows visible to see errors

### Production/Container Deployment
- Disable `REGISTER_TO_LOBBY` for LAN servers
- Configure firewall rules before starting
- Use environment variables for sensitive config
- Monitor logs for errors
- Set up reverse proxy for HTTPS (optional)

### Testing
- Test on LAN before exposing to internet
- Use Direct Connection with IP first
- Verify logs show "Server started" and ports listening
- Check server info endpoint: `http://<server-ip>:8081/INFO`

## Getting Help

If issues persist:

1. **Check Logs:**
   - Backend: Terminal running `npm run dev`
   - AC Server: View via "Server Logs" in UI or API endpoint `/api/server/logs`
   - Frontend: Browser Developer Console (F12)

2. **Verify Paths:**
   - Check `.env` file has correct paths
   - Ensure `acServer.exe` exists at specified path
   - Verify all config files are readable

3. **Test Components:**
   - Backend health: `http://localhost:3001/health`
   - AC server info: `http://<ip>:8081/INFO`
   - Frontend: `http://localhost:5174`

4. **Common Commands:**
   ```powershell
   # Check if AC server is running
   Get-Process acServer -ErrorAction SilentlyContinue
   
   # Check open ports
   Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(3001, 5174, 9600, 8081)}
   
   # View real-time logs
   Get-Content "G:\SteamLibrary\steamapps\common\assettocorsa\server\log\*" -Wait -Tail 50
   ```

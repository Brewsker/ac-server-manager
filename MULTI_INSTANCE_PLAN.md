# Multi-Instance Server Manager - Architecture Plan

## Vision
Transform from single-instance config editor to multi-instance server manager - allowing users to run and manage multiple Assetto Corsa servers simultaneously from one interface.

## Core Changes

### 1. Backend Architecture
- **Process Management**
  - Track multiple AC server processes (one per preset)
  - Start/stop individual servers
  - Monitor server status (running/stopped/crashed)
  - Auto-restart on crash (optional)
  
- **Port Management**
  - Validate port availability before starting
  - Prevent port conflicts between instances
  - Auto-assign ports for cloned presets
  
- **Status Tracking**
  - Which preset = which process ID
  - Server uptime
  - Player count (via UDP plugin or log parsing)
  - Current track/session

### 2. Frontend Changes
- **Sidebar Enhancements**
  - Show server status: 🟢 Running / 🔴 Stopped / ⚠️ Error
  - Display player count (e.g., "4/18")
  - Click to edit config (can edit while running)
  - Quick start/stop toggle
  
- **Dashboard Overhaul**
  - List all running servers
  - Aggregate player counts
  - Quick actions per server
  - Resource usage overview
  
- **Config Editor Buttons**
  - **Save** - Save changes to preset INI files (Ctrl+S)
  - **Folder** - Open presets folder (Ctrl+F)
  - **Clone** - Duplicate preset (Ctrl+D)
  - **Delete** - Remove preset (confirm modal)
  - **Run** - Start this server instance
  - **Stop** - Stop this server instance
  - **Pack** - Create deployment package (Ctrl+P) [future]

### 3. Workflow Changes

**Old Flow:**
1. Load preset → Edit → Apply to "the server" → Save preset

**New Flow:**
1. Select preset from sidebar (shows status)
2. Edit configuration (can edit while running)
3. Save changes (Ctrl+S)
4. Click "Run" to start server (or "Restart" if already running)
5. Monitor in Dashboard
6. Click "Stop" when done

**Multiple Servers:**
- Load preset A → Start → Load preset B → Start → Both running simultaneously
- Dashboard shows both servers, player counts, status
- Can edit either config while running (apply requires restart)

## Implementation Phases

### Phase 1: Backend Foundation
- [ ] Create process manager service
- [ ] Track running servers (preset ID → process ID mapping)
- [ ] Implement start/stop endpoints
- [ ] Add status polling endpoint
- [ ] Port conflict detection

### Phase 2: Frontend Status Display
- [ ] Update sidebar to show server status
- [ ] Add status indicators (🟢🔴⚠️)
- [ ] Real-time status updates (polling or WebSocket)
- [ ] Player count display

### Phase 3: Button Redesign
- [ ] Remove "Apply Config" button
- [ ] Add "Run/Stop" toggle button
- [ ] Consolidate buttons to bottom (CM style)
- [ ] Add "Save" button (Ctrl+S)
- [ ] Add "Folder" button (Ctrl+F)
- [ ] Keep Clone/Delete buttons

### Phase 4: Dashboard Multi-Server View
- [ ] Show all running servers in table
- [ ] Quick start/stop per server
- [ ] Aggregate stats
- [ ] Server health monitoring

### Phase 5: Polish
- [ ] Auto-restart on crash
- [ ] Logs viewer per server
- [ ] Port auto-assignment for clones
- [ ] Pack feature for deployment

## Technical Considerations

### Port Management Strategy
Each preset needs unique:
- UDP_PORT (default: 9600 + preset_index)
- TCP_PORT (default: 9600 + preset_index)
- HTTP_PORT (default: 8081 + preset_index)

When cloning, auto-increment ports to avoid conflicts.

### Process Management
Use Node.js `child_process` to spawn AC server:
```js
const serverProcess = spawn('acServer.exe', [], {
  cwd: acServerPath,
  env: { /* config path */ }
});
```

Track process ID and monitor for crashes.

### Status Polling
- Poll every 2-3 seconds for active servers
- Check process.pid exists
- Parse log files for player counts
- Update frontend via API

## Migration Path
- Current `master` branch = single-instance editor (preserved)
- New `multi-instance-manager` branch = this architecture
- Users can choose which version to use
- No breaking changes to preset file format

## Future Enhancements
- WebSocket for real-time updates (instead of polling)
- Discord webhook notifications (server started/stopped/crashed)
- Scheduled server restarts
- Automatic updates to presets
- Cloud backup of presets
- Remote management (API + authentication)

# AC Server Manager

Modern web-based management interface for Assetto Corsa dedicated servers.

## Project Goals

Build a lightweight, user-friendly web interface for managing Assetto Corsa dedicated servers with:
- Clean, modern UI
- Easy track/car selection
- Server control (start/stop/restart)
- Live monitoring
- Configuration management

## Tech Stack

**Frontend:**
- React (UI framework)
- Tailwind CSS (styling)
- Vite (build tool)

**Backend:**
- Node.js + Express
- SQLite (database)
- WebSockets (real-time updates)

**Deployment:**
- LXC container on Proxmox
- Docker support (optional)

## Project Structure

```
ac-server-manager/
├── backend/              # Node.js Express server
│   ├── src/
│   │   ├── server.js     # Main server
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── package.json
│   └── .env.example
├── frontend/             # React application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   ├── package.json
│   └── vite.config.js
├── docs/                 # Documentation
├── docker/               # Docker configs (future)
└── README.md
```

## Features Roadmap

### Phase 1: MVP (Weeks 1-2)
- [ ] Basic server config editor
- [ ] Track selection dropdown
- [ ] Car selection (multi-select)
- [ ] Server start/stop controls
- [ ] Parse and write `server_cfg.ini`
- [ ] Parse and write `entry_list.ini`

### Phase 2: Core Features (Weeks 3-4)
- [ ] Entry list manager (add/remove drivers)
- [ ] Auto-scan AC content folder for tracks/cars
- [ ] Configuration presets (save/load)
- [ ] Server status monitoring
- [ ] Server log viewer

### Phase 3: Advanced (Month 2)
- [ ] Live session monitoring
- [ ] Connected players list
- [ ] Session timer/progress
- [ ] Results viewer (parse JSON)
- [ ] Basic statistics/leaderboards

### Phase 4: Polish (Month 3+)
- [ ] User authentication
- [ ] Multi-server support
- [ ] Championship management
- [ ] Weather/time progression editor
- [ ] Content upload (tracks/cars)
- [ ] Mobile-responsive design

## Development Setup

### Prerequisites
- Node.js 18+ (LTS)
- npm or yarn
- Git
- Assetto Corsa dedicated server installed
- Code editor (VS Code recommended)

### Initial Setup

1. **Configure Assetto Corsa Path**
   
   The setup wizard will run on first launch and auto-detect your AC installation.
   
   ```bash
   # Navigate to project
   cd "C:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager"
   
   # Install dependencies
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```

2. **Start Development Servers**

   **Option A: Using convenience scripts (Recommended)**
   ```powershell
   # Clean start (kills old processes and starts fresh)
   .\start.ps1 -CleanStart
   
   # Or normal start
   .\start.ps1
   
   # To stop servers
   .\stop.ps1
   
   # To clean up stuck processes
   .\cleanup.ps1
   ```

   **Option B: Manual start**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

### Development Scripts

- `start.ps1` - Start both servers (use `-CleanStart` to cleanup first)
- `stop.ps1` - Stop all development servers
- `cleanup.ps1` - Kill stuck node processes and free up ports

### Troubleshooting

**Port conflicts or "EADDRINUSE" errors:**
```powershell
.\cleanup.ps1
.\start.ps1
```

**Multiple terminal sessions causing issues:**
1. Press `Ctrl+Shift+P` in VS Code
2. Type "Terminal: Kill All Terminals"
3. Press Enter
4. Run `.\cleanup.ps1` then `.\start.ps1`

**Backend crashes immediately:**
- Check `backend/.env` for correct AC paths
- Verify AC_CONTENT_PATH exists
- Run `.\admin-reset.ps1` as Administrator if processes won't die

**Quick Cleanup Commands:**
```powershell
# Kill all node processes and free ports
Get-Process node,nodemon -EA SilentlyContinue | Stop-Process -Force

# Close all VS Code terminals: Ctrl+Shift+P -> "Terminal: Kill All Terminals"

# Or use VS Code tasks: Ctrl+Shift+P -> "Run Task" -> "🔴 Kill All Terminals & Processes"
```

## API Endpoints (Planned)

### Server Control
- `GET /api/server/status` - Get server status
- `POST /api/server/start` - Start AC server
- `POST /api/server/stop` - Stop AC server
- `POST /api/server/restart` - Restart AC server

### Configuration
- `GET /api/config` - Get current server config
- `PUT /api/config` - Update server config
- `GET /api/config/presets` - List saved presets
- `POST /api/config/presets` - Save current config as preset

### Content
- `GET /api/tracks` - List available tracks
- `GET /api/cars` - List available cars
- `GET /api/weather` - List weather presets
- `POST /api/content/upload` - Upload new content

### Entry List
- `GET /api/entries` - Get entry list
- `POST /api/entries` - Add entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Remove entry

### Monitoring
- `GET /api/sessions/current` - Current session info
- `GET /api/sessions/results` - Recent results
- `GET /api/logs` - Server logs
- `WS /api/live` - WebSocket for live updates

## AC Server Files Reference

### server_cfg.ini
Main server configuration file containing:
- Server name, password
- Track, track config
- Max clients
- UDP/TCP/HTTP ports
- Time of day, weather
- Session types and durations

### entry_list.ini
Driver/car assignments:
- Driver name, GUID
- Car model, skin
- Ballast, restrictor
- Pit box number

### Result Files (JSON)
Session results in JSON format containing:
- Laps, times, sectors
- Driver info
- Events (collisions, cuts, etc.)

## Learning Resources

### JavaScript/Node.js
- [JavaScript.info](https://javascript.info/) - Modern JS tutorial
- [Node.js Docs](https://nodejs.org/docs/) - Official docs
- [Express Guide](https://expressjs.com/en/guide/routing.html) - Routing guide

### React
- [React Docs](https://react.dev/) - Official React documentation
- [React Tutorial](https://react.dev/learn) - Interactive tutorial
- [Vite Guide](https://vitejs.dev/guide/) - Vite documentation

### Tools
- [VS Code](https://code.visualstudio.com/) - Code editor
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - Browser extension

## Contributing

This is a personal learning project, but contributions, suggestions, and feedback are welcome!

## License

MIT License - Feel free to use, modify, and distribute.

## Acknowledgments

- Inspired by the acweb project by Kugelschieber
- Assetto Corsa community for documentation
- Kunos Simulazioni for Assetto Corsa

---

## Development Notes

**Current Status:** Project initialization
**Last Updated:** November 29, 2025
**Developer:** Brook

**Next Steps:**
1. Set up Node.js backend skeleton
2. Set up React frontend skeleton
3. Implement basic .ini file parser
4. Create basic UI wireframes
5. Implement server start/stop functionality

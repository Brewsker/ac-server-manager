# AC Server Manager

Modern web-based management interface for Assetto Corsa dedicated servers.

**Status:** Active Development  
**Version:** 0.28.13+  
**Platform:** Proxmox LXC, Linux, Windows

---

## 🚀 Quick Start

### Proxmox LXC (Recommended)

**One-command installation:**

```bash
curl -fsSL "https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/scripts/install/install-proxmox-unified.sh" | bash
```

Creates container, installs everything, opens setup wizard at http://192.168.1.71:3001

### Local Development (Windows/Mac/Linux)

```bash
git clone https://github.com/Brewsker/ac-server-manager.git
cd ac-server-manager
cd backend && npm install
cd ../frontend && npm install
npm run dev  # Start both services
```

Access at http://localhost:5173

### Linux Server

```bash
curl -fsSL "https://raw.githubusercontent.com/Brewsker/ac-server-manager/develop/scripts/install/install-server.sh" | sudo bash
```

---

## 📚 Documentation

### For Users

- 📖 **[USER_MANUAL.md](./docs/USER_MANUAL.md)** - Complete usage guide
- 🚀 **[INSTALLATION.md](./docs/INSTALLATION.md)** - Installation instructions for all platforms
- 🔧 **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- 📦 **[CONTENT_UPLOAD.md](./docs/CONTENT_UPLOAD.md)** - Uploading custom tracks/cars

### For Developers

- 🛠️ **[DEVELOPMENT_PROCEDURE.md](./docs/DEVELOPMENT_PROCEDURE.md)** - Development workflow and best practices
- 🔄 **[VERSION_MANAGEMENT.md](./docs/VERSION_MANAGEMENT.md)** - Versioning and deployment
- 🧪 **[TESTING_CHECKLIST.md](./docs/TESTING_CHECKLIST.md)** - QA procedures
- 🌐 **[API.md](./docs/API.md)** - REST API reference
- 🏗️ **[DEPLOYMENT_ARCHITECTURE.md](./docs/DEPLOYMENT_ARCHITECTURE.md)** - System architecture

### Reference

- 📋 **[COMMANDS.md](./docs/COMMANDS.md)** - Quick command reference
- 🔄 **[UPDATE_SYSTEM.md](./docs/UPDATE_SYSTEM.md)** - Update system documentation
- 📂 **[SERVER_INSTALL.md](./docs/SERVER_INSTALL.md)** - Bare-metal server installation

---

## Project Status

**Current Phase:** Active Development  
**Last Updated:** December 7, 2025  
**Version:** 0.28.13  
**Developer:** Brook

### Recent Updates (v0.16.0)

- ✅ Dynamic version display from API
- ✅ Content status detection (cars/tracks)
- ✅ Reliable deployment system with rollback
- ✅ Automated backups
- ✅ Clean folder structure
- ✅ Comprehensive documentation

### Development Quick Start

The project includes a VS Code control panel with buttons in the status bar:

- **🚀 Backend** - Start backend server
- **🎨 Frontend** - Start frontend dev server
- **🔄 Restart** - Kill all processes and restart both services
- **🔴 Kill All** - Stop all processes and release ports

Just click the buttons to control your development environment!

For deployment to production:

```powershell
.\scripts\deploy-to-proxmox.ps1
```

## Tech Stack

**Frontend:**

- React 18 (UI framework)
- Tailwind CSS (styling)
- Vite 5.x (build tool)
- React Router (navigation)

**Backend:**

- Node.js + Express 4.x
- INI file parsing for AC configs
- Process management for AC server
- RESTful API

**Development:**

- VS Code tasks and keybindings
- VsCode Action Buttons extension
- ESLint + Prettier
- Nodemon for auto-reload

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
- npm
- Git
- Assetto Corsa dedicated server installed
- VS Code (recommended)

### Initial Setup

1. **Install Dependencies**

   ```powershell
   # Backend
   cd backend
   npm install

   # Frontend
   cd ..\frontend
   npm install
   ```

2. **Configure Environment**

   Edit `backend\.env` with your Assetto Corsa paths:

   ```env
   AC_SERVER_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/acServer.exe
   AC_SERVER_CONFIG_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/cfg/server_cfg.ini
   AC_ENTRY_LIST_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/cfg/entry_list.ini
   AC_CONTENT_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/content
   ```

3. **Start Development**

   **Option A: VS Code Status Bar Buttons (Easiest)**

   Look at the bottom-right of VS Code for colored buttons:

   - Click **🚀 Backend** to start backend
   - Click **🎨 Frontend** to start frontend
   - Click **🔄 Restart** to restart everything
   - Click **🔴 Kill All** to stop all processes

   **Option B: VS Code Tasks**

   Press `Ctrl+Shift+P`, type "Run Task", select:

   - `🚀 Start Both Services` - Start backend and frontend
   - `🔴 Hard Reset - Kill All & Restart` - Full restart
   - `🔴 Kill All Terminals & Processes` - Stop everything

   **Option C: Manual**

   ```powershell
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Troubleshooting

**Port conflicts:**
Click the **🔴 Kill All** button in the status bar, then restart.

**Processes won't stop:**

```powershell
Get-Process node,nodemon -EA SilentlyContinue | Stop-Process -Force
```

**Backend errors:**

- Verify paths in `backend\.env`
- Check `backend/error.log` for details
- Ensure AC content folder exists

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

**Code Quality:**

- Memory leak fixes applied (backend event listeners, frontend polling)
- isMountedRef pattern prevents state updates on unmounted components
- AbortController for fetch cleanup
- Comprehensive defaults for config initialization
- Type conversion for INI string values

**Development Tools:**

- VS Code Action Buttons for easy server control
- Tasks configured for common operations
- AI development guidelines in `.cursorrules`
- ESLint for code quality

**Recent Changes:**

- Added VS Code status bar control panel
- Fixed memory leaks in serverService and frontend polling
- Improved config state management with proper defaults
- Added graceful shutdown handlers

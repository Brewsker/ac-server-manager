# Quick Reference Guide

## Project Commands

### Backend

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run development server (with auto-reload)
npm run dev

# Run production server
npm start
```

### Frontend

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Important File Locations

### Configuration Files
- Backend env: `backend/.env`
- Frontend env: `frontend/.env`
- VS Code settings: `.vscode/settings.json`
- ESLint config: `.eslintrc.cjs`
- Prettier config: `.prettierrc`

### Backend
- Main server: `backend/src/server.js`
- Routes: `backend/src/routes/`
- Services: `backend/src/services/`
- Utils: `backend/src/utils/`

### Frontend
- Main app: `frontend/src/App.jsx`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- API client: `frontend/src/api/client.js`
- Styles: `frontend/src/index.css`

## API Endpoints Quick List

```
GET    /api/server/status           - Server status
POST   /api/server/start            - Start server
POST   /api/server/stop             - Stop server
POST   /api/server/restart          - Restart server
GET    /api/server/logs             - Server logs

GET    /api/config                  - Get config
PUT    /api/config                  - Update config
GET    /api/config/presets          - List presets
POST   /api/config/presets          - Save preset

GET    /api/content/tracks          - List tracks
GET    /api/content/cars            - List cars
GET    /api/content/weather         - Weather presets
POST   /api/content/scan            - Scan content

GET    /api/entries                 - List entries
POST   /api/entries                 - Add entry
PUT    /api/entries/:id             - Update entry
DELETE /api/entries/:id             - Delete entry
```

## Common Code Patterns

### Adding a Backend Route

1. Create route file in `backend/src/routes/`
2. Create service file in `backend/src/services/`
3. Import and use in `backend/src/server.js`

### Adding a Frontend Page

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link in `frontend/src/components/Layout.jsx`

### Making an API Call

```javascript
import api from '../api/client';

const data = await api.getServerStatus();
```

### Using Tailwind Classes

```jsx
<button className="btn-primary">Click Me</button>
<input className="input-field" />
<div className="card">Content</div>
```

## Development Ports

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- WebSocket (future): ws://localhost:3002

## Environment Variables

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
AC_SERVER_PATH=path/to/acServer.exe
AC_SERVER_CONFIG_PATH=path/to/server_cfg.ini
AC_ENTRY_LIST_PATH=path/to/entry_list.ini
AC_CONTENT_PATH=path/to/content
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

## Debugging Tips

### Backend Not Starting
- Check `.env` file exists and has correct paths
- Verify port 3001 is not in use
- Check `npm install` completed successfully

### Frontend Build Errors
- Clear node_modules: `rm -r node_modules; npm install`
- Check for syntax errors in components
- Verify all imports are correct

### API Not Connecting
- Verify backend is running
- Check CORS configuration in `backend/src/server.js`
- Verify API URL in frontend `.env`

### Style Not Applying
- Check Tailwind classes are correct
- Verify Tailwind config includes your files
- Check `index.css` imports Tailwind directives

## Git Workflow

```powershell
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push
git push
```

## VS Code Shortcuts

- `Ctrl+P` - Quick file open
- `Ctrl+Shift+P` - Command palette
- `Ctrl+`` - Toggle terminal
- `Ctrl+B` - Toggle sidebar
- `F5` - Start debugging
- `Ctrl+/` - Toggle comment

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend builds and runs
- [ ] API endpoints respond correctly
- [ ] UI renders properly
- [ ] No console errors
- [ ] Changes are committed

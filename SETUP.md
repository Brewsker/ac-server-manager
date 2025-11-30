# AC Server Manager - Setup Instructions

## Quick Setup Script

Run this in PowerShell from the project root:

```powershell
# Install backend dependencies
cd backend
npm install

# Copy environment file
Copy-Item .env.example .env

# Go back to root
cd ..

# Install frontend dependencies
cd frontend
npm install

# Copy environment file
Copy-Item .env.example .env

# Go back to root
cd ..

Write-Host "Setup complete! Now edit backend/.env with your AC paths" -ForegroundColor Green
```

## Manual Setup Steps

### 1. Install Backend

```powershell
cd backend
npm install
```

### 2. Configure Backend Environment

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

Edit the `.env` file and set your Assetto Corsa paths:

```env
# Example for Steam installation
AC_SERVER_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/acServer.exe
AC_SERVER_CONFIG_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/cfg/server_cfg.ini
AC_ENTRY_LIST_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/cfg/entry_list.ini
AC_CONTENT_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/content
```

### 3. Install Frontend

```powershell
cd ..\frontend
npm install
```

### 4. Configure Frontend Environment

```powershell
Copy-Item .env.example .env
```

The default values should work for local development.

### 5. Start Development Servers

Open two terminals:

**Terminal 1 (Backend):**
```powershell
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

### 6. Verify Setup

Open http://localhost:5173 in your browser. You should see the AC Server Manager interface.

## Next Steps

1. Configure your AC server settings in the Settings page
2. Add tracks and cars in the Server Config page
3. Manage driver entries in the Entry List page
4. Start the server from the Dashboard

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed documentation.

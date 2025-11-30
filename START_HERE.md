# 🏁 AC Server Manager - Start Here!

## ✅ Setup Complete!

Your project has been scaffolded and dependencies are installed.

## 📝 Important: Configure Your AC Paths

Before starting the servers, edit `backend/.env` and set your Assetto Corsa paths:

```env
# Example paths - UPDATE THESE to match your AC installation
AC_SERVER_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/acServer.exe
AC_SERVER_CONFIG_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/cfg/server_cfg.ini
AC_ENTRY_LIST_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/server/cfg/entry_list.ini
AC_CONTENT_PATH=C:/Program Files (x86)/Steam/steamapps/common/assettocorsa/content
```

## 🚀 Start Development

Open **TWO** PowerShell terminals:

### Terminal 1 - Backend
```powershell
cd "c:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager\backend"
npm run dev
```

### Terminal 2 - Frontend
```powershell
cd "c:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager\frontend"
npm run dev
```

## 🌐 Access the App

Once both servers are running:
- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:3001>
- **Health Check**: <http://localhost:3001/health>

## 📚 Next Steps

1. **Configure AC Paths** - Edit `backend/.env` with your paths
2. **Explore the UI** - Open <http://localhost:5173>
3. **Check Documentation** - See `docs/GETTING_STARTED.md`
4. **Use AI Agents** - See `docs/AGENT_GUIDE.md` for integration tips

## 🛠️ What's Included

### Backend Features
- ✅ Express REST API with 4 route modules
- ✅ Service layer for business logic
- ✅ INI file parsing utilities
- ✅ Process management for AC server
- ✅ Error handling middleware

### Frontend Features
- ✅ React + Vite + Tailwind CSS
- ✅ 5 complete pages (Dashboard, Config, Entries, Monitoring, Settings)
- ✅ Professional UI with sidebar navigation
- ✅ Complete API client
- ✅ Responsive design

### Documentation
- ✅ API documentation
- ✅ Getting started guide
- ✅ **Agent integration guide** for AI-assisted development
- ✅ Quick reference
- ✅ Example code and configs

## 🤖 Agent-Ready Development

This project is designed to work seamlessly with AI coding assistants:

- Consistent code patterns throughout
- TODOs marked for implementation
- Comprehensive documentation in `docs/AGENT_GUIDE.md`
- Example components and utilities

## 🔧 Common Commands

```powershell
# Install dependencies (already done!)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 📖 Learning Resources

- **Getting Started**: `docs/GETTING_STARTED.md`
- **API Docs**: `docs/API.md`
- **Quick Reference**: `docs/QUICK_REFERENCE.md`
- **Agent Guide**: `docs/AGENT_GUIDE.md`

## 🎯 Current Status

**Phase**: Initial Setup Complete ✅
**Next**: Configure environment and start implementing features

The project structure is complete with:
- ✅ Backend scaffolded with routes and services
- ✅ Frontend scaffolded with pages and components
- ✅ Dependencies installed
- ✅ Environment files created
- ✅ Documentation ready

Ready to start development! 🎉

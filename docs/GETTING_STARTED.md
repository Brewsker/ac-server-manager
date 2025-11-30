# AC Server Manager - Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Assetto Corsa** with dedicated server files

## Quick Start

### 1. Clone/Navigate to Project

```powershell
cd "C:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager"
```

### 2. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 3. Install Frontend Dependencies

```powershell
cd ..\frontend
npm install
```

### 4. Configure Environment Variables

#### Backend Configuration

Copy the example environment file:
```powershell
cd ..\backend
Copy-Item .env.example .env
```

Edit `.env` and set your AC server paths:
```env
# Example paths - adjust to your installation
AC_SERVER_PATH=C:/Steam/steamapps/common/assettocorsa/server/acServer.exe
AC_SERVER_CONFIG_PATH=C:/Steam/steamapps/common/assettocorsa/server/cfg/server_cfg.ini
AC_ENTRY_LIST_PATH=C:/Steam/steamapps/common/assettocorsa/server/cfg/entry_list.ini
AC_CONTENT_PATH=C:/Steam/steamapps/common/assettocorsa/content
```

#### Frontend Configuration

```powershell
cd ..\frontend
Copy-Item .env.example .env
```

The default API URL should work for local development.

### 5. Run the Application

You'll need two terminal windows/tabs:

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Project Structure

```
AC Server Manager/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── server.js          # Main server entry point
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helper functions
│   ├── package.json
│   └── .env
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   └── api/               # API client
│   ├── package.json
│   └── vite.config.js
├── docs/                       # Documentation
└── README.md
```

## Development Workflow

### Making Changes

1. **Backend changes** - Server auto-restarts with nodemon
2. **Frontend changes** - Hot module replacement (HMR) updates instantly
3. Test your changes in the browser

### Common Tasks

#### Add a New API Endpoint

1. Create/update route in `backend/src/routes/`
2. Implement logic in `backend/src/services/`
3. Add client method in `frontend/src/api/client.js`
4. Use in your React components

#### Add a New Page

1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link in `frontend/src/components/Layout.jsx`

#### Testing API Endpoints

Use the health check endpoint to verify backend is running:
```powershell
curl http://localhost:3001/health
```

Or use a tool like [Postman](https://www.postman.com/) for more complex testing.

## Troubleshooting

### Backend won't start

- Check that all environment variables in `.env` are set
- Verify paths to AC installation are correct
- Check port 3001 is not already in use

### Frontend won't start

- Ensure dependencies are installed: `npm install`
- Check port 5173 is not already in use
- Clear cache: `npm run build` then `npm run dev`

### Can't connect to API

- Verify backend is running on port 3001
- Check CORS settings in `backend/src/server.js`
- Verify `.env` file in frontend has correct API URL

## Next Steps

1. **Configure AC Paths** - Set up your Assetto Corsa installation paths
2. **Explore the UI** - Navigate through Dashboard, Config, Entry List pages
3. **Read the Docs** - Check `docs/` folder for detailed guides
4. **Start Building** - Follow the Development Plan to implement features

## Useful Commands

```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Getting Help

- Check the [API Documentation](./API.md)
- Review the [Development Plan](../DEVELOPMENT_PLAN.md)
- Look at example files in `docs/examples/`

## Contributing

This is a learning project! Feel free to:
- Experiment with new features
- Refactor existing code
- Add documentation
- Fix bugs

Happy coding! 🚗💨

# AC Server Manager

A web-based management interface for Assetto Corsa dedicated servers. This application provides a comprehensive API and tooling for managing AC server configurations, entry lists, and server process control.

## Features

- **Server Configuration Management**: Create, update, and manage server configurations
- **Entry List Management**: Manage car/driver entries for your server
- **Server Process Control**: Start, stop, and restart the AC dedicated server
- **Content Discovery**: Automatically scan and list available tracks and cars
- **RESTful API**: Full REST API for integration with other tools
- **Input Validation**: Comprehensive validation for all configuration values

## Prerequisites

- Node.js 18.0.0 or higher
- Assetto Corsa Dedicated Server (optional for full functionality)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Brewsker/ac-server-manager.git
cd ac-server-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure the environment variables in `.env`:
```env
PORT=3001
NODE_ENV=development
AC_SERVER_PATH=/path/to/assetto-corsa-server
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
```

## Usage

### Start the Server

```bash
# Development mode with auto-reload
npm run server:dev

# Production mode
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### API Endpoints

#### Health Check
- `GET /api/health` - Check API health status
- `GET /api` - Get API information

#### Server Configuration
- `GET /api/configs` - List all configurations
- `GET /api/configs/defaults` - Get default configuration values
- `GET /api/configs/:id` - Get a specific configuration
- `POST /api/configs` - Create a new configuration
- `PUT /api/configs/:id` - Update a configuration
- `DELETE /api/configs/:id` - Delete a configuration
- `POST /api/configs/:id/save` - Save configuration to disk

#### Server Control
- `GET /api/server/status` - Get server status
- `POST /api/server/start` - Start the server
- `POST /api/server/stop` - Stop the server
- `POST /api/server/restart` - Restart the server
- `POST /api/server/kick` - Kick a player
- `POST /api/server/message` - Send a server message
- `GET /api/server/logs` - Get server logs

#### Content (Tracks & Cars)
- `GET /api/content/tracks` - List all tracks
- `GET /api/content/tracks/:id` - Get a specific track
- `GET /api/content/tracks/search?q=<query>` - Search tracks
- `GET /api/content/cars` - List all cars
- `GET /api/content/cars/:id` - Get a specific car
- `GET /api/content/cars/search?q=<query>` - Search cars
- `POST /api/content/refresh` - Refresh content cache

#### Entry Lists
- `GET /api/entries` - List all entry lists
- `GET /api/entries/:id` - Get a specific entry list
- `POST /api/entries` - Create a new entry list
- `PUT /api/entries/:id` - Update an entry list
- `DELETE /api/entries/:id` - Delete an entry list
- `POST /api/entries/:id/cars` - Add a car entry
- `PUT /api/entries/:id/cars/:entryId` - Update a car entry
- `DELETE /api/entries/:id/cars/:entryId` - Remove a car entry
- `POST /api/entries/:id/save` - Save entry list to disk

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "errors": []
  }
}
```

## Project Structure

```
ac-server-manager/
├── server/
│   └── src/
│       ├── config/          # Configuration management
│       │   ├── index.js     # App configuration
│       │   └── logger.js    # Winston logger setup
│       ├── controllers/     # Request handlers
│       │   ├── configController.js
│       │   ├── serverController.js
│       │   ├── contentController.js
│       │   └── entryListController.js
│       ├── middleware/      # Express middleware
│       │   ├── errorHandler.js
│       │   └── validators.js
│       ├── models/          # Data models
│       │   ├── ServerConfig.js
│       │   ├── EntryList.js
│       │   └── ServerStatus.js
│       ├── routes/          # API routes
│       │   ├── configRoutes.js
│       │   ├── serverRoutes.js
│       │   ├── contentRoutes.js
│       │   └── entryListRoutes.js
│       ├── services/        # Business logic
│       │   ├── ConfigService.js
│       │   ├── ServerService.js
│       │   └── ContentService.js
│       ├── utils/           # Utility functions
│       │   ├── errors.js
│       │   └── response.js
│       ├── app.js           # Express app setup
│       └── index.js         # Entry point
├── tests/
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── .env.example             # Example environment config
├── .gitignore
├── jest.config.js           # Jest configuration
├── package.json
└── README.md
```

## Configuration Options

### Server Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| name | string | "AC Server" | Server name displayed in lobby |
| password | string | "" | Server password |
| adminPassword | string | "admin" | Admin password for server control |
| maxClients | number | 16 | Maximum connected clients (1-24) |
| udpPort | number | 9600 | UDP port for game traffic |
| tcpPort | number | 9600 | TCP port for HTTP info |
| httpPort | number | 8081 | HTTP port for server info |
| track | string | "imola" | Track name |
| trackConfig | string | "" | Track configuration/layout |
| practiceTime | number | 10 | Practice session time (minutes) |
| qualifyTime | number | 15 | Qualifying session time (minutes) |
| raceLaps | number | 10 | Number of race laps |

### Entry Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| model | string | "" | Car model name (required) |
| skin | string | "" | Car skin name |
| driverName | string | "" | Driver name |
| team | string | "" | Team name |
| guid | string | "" | Steam GUID for reserved slot |
| ballast | number | 0 | Ballast weight (0-150 kg) |
| restrictor | number | 0 | Restrictor percentage (0-100%) |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Assetto Corsa by Kunos Simulazioni
- Express.js team
- Node.js community

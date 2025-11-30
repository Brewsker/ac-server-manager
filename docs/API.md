# AC Server Manager - API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently no authentication is implemented. This will be added in a future version.

---

## Server Endpoints

### Get Server Status

Get the current status of the AC server.

**Endpoint:** `GET /api/server/status`

**Response:**
```json
{
  "running": true,
  "pid": 12345,
  "uptime": 156000
}
```

**Fields:**
- `running` (boolean) - Whether server is currently running
- `pid` (number|null) - Process ID of the server
- `uptime` (number) - Server uptime in milliseconds

---

### Start Server

Start the Assetto Corsa server.

**Endpoint:** `POST /api/server/start`

**Response:**
```json
{
  "success": true,
  "message": "Server started successfully",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

**Errors:**
- 400 - Server is already running
- 500 - Failed to start server

---

### Stop Server

Stop the running AC server.

**Endpoint:** `POST /api/server/stop`

**Response:**
```json
{
  "success": true,
  "message": "Server stopped successfully",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

**Errors:**
- 400 - Server is not running
- 500 - Failed to stop server

---

### Restart Server

Restart the AC server (stop then start).

**Endpoint:** `POST /api/server/restart`

**Response:**
```json
{
  "success": true,
  "message": "Server restarted",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

### Get Server Logs

Retrieve recent server log entries.

**Endpoint:** `GET /api/server/logs?lines=100`

**Query Parameters:**
- `lines` (number, optional) - Number of log lines to return (default: 100)

**Response:**
```json
{
  "logs": [
    "[2025-11-29 12:00:00] Server started",
    "[2025-11-29 12:01:00] Player connected: John Doe"
  ],
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

## Configuration Endpoints

### Get Configuration

Get current server configuration.

**Endpoint:** `GET /api/config`

**Response:**
```json
{
  "SERVER": {
    "NAME": "My AC Server",
    "TRACK": "spa",
    "MAX_CLIENTS": 24,
    "UDP_PORT": 9600,
    "TCP_PORT": 9601,
    "HTTP_PORT": 8081
  },
  "PRACTICE": {
    "TIME": 30,
    "WAIT_TIME": 60
  },
  "RACE": {
    "LAPS": 10,
    "WAIT_TIME": 60
  }
}
```

---

### Update Configuration

Update server configuration.

**Endpoint:** `PUT /api/config`

**Request Body:**
```json
{
  "SERVER": {
    "NAME": "Updated Server Name",
    "TRACK": "monza",
    "MAX_CLIENTS": 32
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

### Get Configuration Presets

List all saved configuration presets.

**Endpoint:** `GET /api/config/presets`

**Response:**
```json
{
  "presets": [
    {
      "id": 1,
      "name": "Sprint Race Setup",
      "created": "2025-11-29T12:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Endurance Setup",
      "created": "2025-11-28T12:00:00.000Z"
    }
  ]
}
```

---

### Save Configuration Preset

Save current configuration as a preset.

**Endpoint:** `POST /api/config/presets`

**Request Body:**
```json
{
  "name": "My Custom Setup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preset 'My Custom Setup' saved",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

### Load Configuration Preset

Load a saved preset.

**Endpoint:** `POST /api/config/presets/:id/load`

**Response:**
```json
{
  "success": true,
  "message": "Preset loaded",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

## Content Endpoints

### Get Tracks

List all available tracks.

**Endpoint:** `GET /api/content/tracks`

**Response:**
```json
[
  {
    "id": "spa",
    "name": "Spa Francorchamps",
    "path": "C:/AC/content/tracks/spa"
  },
  {
    "id": "monza",
    "name": "Monza",
    "path": "C:/AC/content/tracks/monza"
  }
]
```

---

### Get Cars

List all available cars.

**Endpoint:** `GET /api/content/cars`

**Response:**
```json
[
  {
    "id": "bmw_m3_e92",
    "name": "BMW M3 E92",
    "path": "C:/AC/content/cars/bmw_m3_e92"
  },
  {
    "id": "ks_porsche_911_gt3_rs",
    "name": "Porsche 911 GT3 RS",
    "path": "C:/AC/content/cars/ks_porsche_911_gt3_rs"
  }
]
```

---

### Get Weather Presets

List available weather types.

**Endpoint:** `GET /api/content/weather`

**Response:**
```json
[
  {
    "id": "1_light_clouds",
    "name": "Light Clouds"
  },
  {
    "id": "3_clear",
    "name": "Clear"
  }
]
```

---

### Scan Content

Scan AC content folder for all tracks and cars.

**Endpoint:** `POST /api/content/scan`

**Response:**
```json
{
  "tracks": 25,
  "cars": 178,
  "weather": 6,
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

## Entry List Endpoints

### Get Entries

Get all driver/car entries.

**Endpoint:** `GET /api/entries`

**Response:**
```json
[
  {
    "id": "CAR_0",
    "DRIVERNAME": "John Doe",
    "MODEL": "bmw_m3_e92",
    "SKIN": "default",
    "GUID": "",
    "BALLAST": 0,
    "RESTRICTOR": 0
  }
]
```

---

### Add Entry

Add a new driver/car entry.

**Endpoint:** `POST /api/entries`

**Request Body:**
```json
{
  "DRIVERNAME": "Jane Smith",
  "MODEL": "ks_porsche_911_gt3_rs",
  "SKIN": "red",
  "GUID": "",
  "BALLAST": 0,
  "RESTRICTOR": 0
}
```

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": "CAR_1",
    "DRIVERNAME": "Jane Smith",
    "MODEL": "ks_porsche_911_gt3_rs",
    "SKIN": "red"
  },
  "message": "Entry added"
}
```

---

### Update Entry

Update an existing entry.

**Endpoint:** `PUT /api/entries/:id`

**Request Body:**
```json
{
  "DRIVERNAME": "Jane Smith Updated",
  "BALLAST": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entry updated"
}
```

---

### Delete Entry

Remove an entry from the list.

**Endpoint:** `DELETE /api/entries/:id`

**Response:**
```json
{
  "success": true,
  "message": "Entry deleted"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

**Common Status Codes:**
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented.

## WebSocket Events (Future)

Real-time updates will be available via WebSocket connection:

```javascript
const ws = new WebSocket('ws://localhost:3002');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Live update:', data);
};
```

**Event Types:**
- `server.status` - Server status changes
- `player.connected` - Player joins
- `player.disconnected` - Player leaves
- `lap.completed` - Lap time posted

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Map of preset ID to running server process info
const runningServers = new Map();

/**
 * Get the AC server executable path from environment or default location
 */
function getACServerPath() {
  return process.env.AC_SERVER_PATH || path.join(process.cwd(), '..', 'acServer');
}

/**
 * Get server executable name based on platform
 */
function getServerExecutable() {
  return process.platform === 'win32' ? 'acServer.exe' : 'acServer';
}

/**
 * Check if AC server installation exists
 */
export async function checkACServerInstallation() {
  const serverPath = getACServerPath();
  const executable = path.join(serverPath, getServerExecutable());
  
  try {
    await fs.access(executable);
    return { exists: true, path: serverPath };
  } catch {
    return { exists: false, path: serverPath };
  }
}

/**
 * Start a server instance for a preset
 * @param {string} presetId - The preset ID
 * @param {object} config - Server configuration
 * @returns {Promise<object>} Server process info
 */
export async function startServer(presetId, config) {
  // Check if server is already running for this preset
  if (runningServers.has(presetId)) {
    throw new Error(`Server already running for preset ${presetId}`);
  }

  const serverPath = getACServerPath();
  const executable = getServerExecutable();
  
  // Check installation
  const installation = await checkACServerInstallation();
  if (!installation.exists) {
    throw new Error(`AC Server not found at ${serverPath}. Please set AC_SERVER_PATH environment variable.`);
  }

  // Validate port availability
  const udpPort = config?.SERVER?.UDP_PORT || 9600;
  const tcpPort = config?.SERVER?.TCP_PORT || 9600;
  const httpPort = config?.SERVER?.HTTP_PORT || 8081;

  // Check if ports are already in use by another preset
  for (const [id, serverInfo] of runningServers.entries()) {
    if (id !== presetId) {
      const otherConfig = serverInfo.config;
      if (otherConfig?.SERVER?.UDP_PORT === udpPort) {
        throw new Error(`UDP port ${udpPort} already in use by another server`);
      }
      if (otherConfig?.SERVER?.TCP_PORT === tcpPort) {
        throw new Error(`TCP port ${tcpPort} already in use by another server`);
      }
      if (otherConfig?.SERVER?.HTTP_PORT === httpPort) {
        throw new Error(`HTTP port ${httpPort} already in use by another server`);
      }
    }
  }

  console.log(`[ServerProcess] Starting AC server for preset ${presetId}...`);
  console.log(`[ServerProcess] Server path: ${serverPath}`);
  console.log(`[ServerProcess] Ports: UDP=${udpPort}, TCP=${tcpPort}, HTTP=${httpPort}`);

  // Spawn the AC server process
  const serverProcess = spawn(`./${executable}`, [], {
    cwd: serverPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    windowsHide: false, // Show console window on Windows
  });

  const serverInfo = {
    presetId,
    process: serverProcess,
    pid: serverProcess.pid,
    config,
    startTime: new Date(),
    status: 'starting',
    stdout: [],
    stderr: [],
  };

  // Capture stdout
  serverProcess.stdout.on('data', (data) => {
    const line = data.toString();
    console.log(`[AC Server ${presetId}] ${line}`);
    serverInfo.stdout.push({ timestamp: new Date(), line });
    
    // Limit log size
    if (serverInfo.stdout.length > 1000) {
      serverInfo.stdout.shift();
    }
    
    // Detect when server is ready
    if (line.includes('Server started') || line.includes('PAGE: acStartPage')) {
      serverInfo.status = 'running';
    }
  });

  // Capture stderr
  serverProcess.stderr.on('data', (data) => {
    const line = data.toString();
    console.error(`[AC Server ${presetId}] ERROR: ${line}`);
    serverInfo.stderr.push({ timestamp: new Date(), line });
    
    // Limit log size
    if (serverInfo.stderr.length > 1000) {
      serverInfo.stderr.shift();
    }
  });

  // Handle process exit
  serverProcess.on('exit', (code, signal) => {
    console.log(`[ServerProcess] Server ${presetId} exited with code ${code}, signal ${signal}`);
    serverInfo.status = 'stopped';
    serverInfo.exitCode = code;
    serverInfo.exitSignal = signal;
    serverInfo.stopTime = new Date();
    
    // Remove from running servers after a delay (keep info for status check)
    setTimeout(() => {
      runningServers.delete(presetId);
    }, 5000);
  });

  // Handle errors
  serverProcess.on('error', (error) => {
    console.error(`[ServerProcess] Failed to start server ${presetId}:`, error);
    serverInfo.status = 'error';
    serverInfo.error = error.message;
  });

  runningServers.set(presetId, serverInfo);

  return {
    presetId,
    pid: serverProcess.pid,
    status: 'starting',
    startTime: serverInfo.startTime,
  };
}

/**
 * Stop a server instance
 * @param {string} presetId - The preset ID
 * @returns {Promise<object>} Stop result
 */
export async function stopServer(presetId) {
  const serverInfo = runningServers.get(presetId);
  
  if (!serverInfo) {
    throw new Error(`No running server found for preset ${presetId}`);
  }

  console.log(`[ServerProcess] Stopping server ${presetId} (PID: ${serverInfo.pid})...`);

  return new Promise((resolve, reject) => {
    const process = serverInfo.process;
    
    // Set a timeout for forceful kill
    const killTimeout = setTimeout(() => {
      console.log(`[ServerProcess] Force killing server ${presetId}...`);
      process.kill('SIGKILL');
    }, 10000); // 10 seconds

    process.on('exit', () => {
      clearTimeout(killTimeout);
      resolve({
        presetId,
        status: 'stopped',
        message: 'Server stopped successfully',
      });
    });

    // Try graceful shutdown first
    if (process.platform === 'win32') {
      // On Windows, use taskkill for graceful shutdown
      spawn('taskkill', ['/pid', serverInfo.pid, '/t', '/f']);
    } else {
      process.kill('SIGTERM');
    }
  });
}

/**
 * Get status of a server instance
 * @param {string} presetId - The preset ID
 * @returns {object|null} Server status or null if not running
 */
export function getServerStatus(presetId) {
  const serverInfo = runningServers.get(presetId);
  
  if (!serverInfo) {
    return null;
  }

  return {
    presetId,
    pid: serverInfo.pid,
    status: serverInfo.status,
    startTime: serverInfo.startTime,
    stopTime: serverInfo.stopTime,
    uptime: serverInfo.status === 'running' 
      ? Date.now() - serverInfo.startTime.getTime() 
      : null,
    config: {
      serverName: serverInfo.config?.SERVER?.NAME,
      udpPort: serverInfo.config?.SERVER?.UDP_PORT,
      tcpPort: serverInfo.config?.SERVER?.TCP_PORT,
      httpPort: serverInfo.config?.SERVER?.HTTP_PORT,
      maxClients: serverInfo.config?.SERVER?.MAX_CLIENTS,
    },
  };
}

/**
 * Get status of all running servers
 * @returns {Array} Array of server statuses
 */
export function getAllServerStatuses() {
  const statuses = [];
  
  for (const [presetId] of runningServers.entries()) {
    const status = getServerStatus(presetId);
    if (status) {
      statuses.push(status);
    }
  }
  
  return statuses;
}

/**
 * Get server logs
 * @param {string} presetId - The preset ID
 * @param {number} lines - Number of lines to retrieve (default: 100)
 * @returns {object} Server logs
 */
export function getServerLogs(presetId, lines = 100) {
  const serverInfo = runningServers.get(presetId);
  
  if (!serverInfo) {
    throw new Error(`No server found for preset ${presetId}`);
  }

  return {
    presetId,
    stdout: serverInfo.stdout.slice(-lines),
    stderr: serverInfo.stderr.slice(-lines),
  };
}

/**
 * Restart a server instance
 * @param {string} presetId - The preset ID
 * @param {object} config - Server configuration
 * @returns {Promise<object>} Server process info
 */
export async function restartServer(presetId, config) {
  console.log(`[ServerProcess] Restarting server ${presetId}...`);
  
  // Stop if running
  if (runningServers.has(presetId)) {
    await stopServer(presetId);
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Start again
  return startServer(presetId, config);
}

/**
 * Stop all running servers
 * @returns {Promise<Array>} Results for each server
 */
export async function stopAllServers() {
  const promises = [];
  
  for (const [presetId] of runningServers.entries()) {
    promises.push(
      stopServer(presetId).catch(err => ({
        presetId,
        error: err.message,
      }))
    );
  }
  
  return Promise.all(promises);
}

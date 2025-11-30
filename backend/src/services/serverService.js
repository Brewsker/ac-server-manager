import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

let serverProcess = null;
let serverStartTime = null;
let serverLogs = [];

/**
 * Get current server status
 */
export async function getServerStatus() {
  return {
    running: serverProcess !== null && !serverProcess.killed,
    pid: serverProcess?.pid || null,
    uptime: serverStartTime ? Date.now() - serverStartTime : 0
  };
}

/**
 * Cleanup event listeners from previous server process
 */
function cleanupServerProcess() {
  if (serverProcess) {
    // Remove all listeners to prevent memory leaks
    serverProcess.stdout?.removeAllListeners();
    serverProcess.stderr?.removeAllListeners();
    serverProcess.removeAllListeners();
  }
}

/**
 * Start AC server
 */
export async function startServer() {
  if (serverProcess && !serverProcess.killed) {
    throw new Error('Server is already running');
  }

  // Clean up any lingering references from previous runs
  cleanupServerProcess();

  const acServerPath = process.env.AC_SERVER_PATH;
  if (!acServerPath) {
    throw new Error('AC_SERVER_PATH not configured in .env');
  }

  // Verify server executable exists
  try {
    await fs.access(acServerPath);
  } catch (error) {
    throw new Error(`AC server executable not found at: ${acServerPath}`);
  }

  // Get the server directory
  const serverDir = path.dirname(acServerPath);
  const serverExe = path.basename(acServerPath);

  // Spawn AC server process
  serverProcess = spawn(serverExe, [], {
    cwd: serverDir,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverStartTime = Date.now();
  serverLogs = [];

  // Capture stdout
  const handleStdout = (data) => {
    const log = data.toString();
    console.log(`[AC Server] ${log}`);
    serverLogs.push(`[${new Date().toISOString()}] ${log}`);
    // Keep only last 1000 log lines
    if (serverLogs.length > 1000) {
      serverLogs.shift();
    }
  };

  // Capture stderr
  const handleStderr = (data) => {
    const log = data.toString();
    console.error(`[AC Server Error] ${log}`);
    serverLogs.push(`[${new Date().toISOString()}] ERROR: ${log}`);
    if (serverLogs.length > 1000) {
      serverLogs.shift();
    }
  };

  // Handle process exit
  const handleClose = (code) => {
    console.log(`AC Server process exited with code ${code}`);
    serverLogs.push(`[${new Date().toISOString()}] Server stopped (exit code: ${code})`);
    cleanupServerProcess();
    serverProcess = null;
    serverStartTime = null;
  };

  // Handle process errors
  const handleError = (error) => {
    console.error('Failed to start AC server:', error);
    serverLogs.push(`[${new Date().toISOString()}] ERROR: ${error.message}`);
    cleanupServerProcess();
    serverProcess = null;
    serverStartTime = null;
  };

  // Attach event listeners
  serverProcess.stdout.on('data', handleStdout);
  serverProcess.stderr.on('data', handleStderr);
  serverProcess.on('close', handleClose);
  serverProcess.on('error', handleError);

  return {
    success: true,
    message: 'AC server started successfully',
    pid: serverProcess.pid,
    timestamp: new Date().toISOString()
  };
}

/**
 * Stop AC server
 */
export async function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    throw new Error('Server is not running');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Force kill if not stopped after 5 seconds
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      cleanupServerProcess();
      reject(new Error('Server did not stop gracefully, force killed'));
    }, 5000);

    const handleClose = () => {
      clearTimeout(timeout);
      cleanupServerProcess();
      resolve({
        success: true,
        message: 'AC server stopped successfully',
        timestamp: new Date().toISOString()
      });
    };

    // Use once() to ensure listener only fires once
    serverProcess.once('close', handleClose);

    // Try graceful shutdown first
    serverProcess.kill('SIGTERM');
  });
}

/**
 * Restart AC server
 */
export async function restartServer() {
  await stopServer();
  // Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 2000));
  await startServer();

  return {
    success: true,
    message: 'Server restarted',
    timestamp: new Date().toISOString()
  };
}

/**
 * Get server logs
 */
export async function getServerLogs(lines = 100) {
  const requestedLines = Math.min(Math.max(1, lines), 1000);
  const logsToReturn = serverLogs.slice(-requestedLines);

  return {
    logs: logsToReturn.length > 0 ? logsToReturn : ['No logs available. Start the server to see logs.'],
    timestamp: new Date().toISOString()
  };
}

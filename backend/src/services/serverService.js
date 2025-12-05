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
    uptime: serverStartTime ? Date.now() - serverStartTime : 0,
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
    stdio: ['ignore', 'pipe', 'pipe'],
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
    timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await startServer();

  return {
    success: true,
    message: 'Server restarted',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get server logs
 */
export async function getServerLogs(lines = 100) {
  const requestedLines = Math.min(Math.max(1, lines), 1000);
  const logsToReturn = serverLogs.slice(-requestedLines);

  return {
    logs:
      logsToReturn.length > 0 ? logsToReturn : ['No logs available. Start the server to see logs.'],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get system/container resource statistics
 * Returns CPU, memory, storage, and uptime information
 */
export async function getSystemStats() {
  const os = await import('os');
  const { execSync } = await import('child_process');

  try {
    // CPU info
    const cpus = os.cpus();
    const cpuCount = cpus.length;

    // Calculate CPU usage from /proc/stat (more accurate for containers)
    let cpuUsage = 0;
    try {
      const stat1 = await fs.readFile('/proc/stat', 'utf8');
      await new Promise((resolve) => setTimeout(resolve, 100));
      const stat2 = await fs.readFile('/proc/stat', 'utf8');

      const parse = (stat) => {
        const line = stat.split('\n')[0]; // cpu line
        const parts = line.split(/\s+/).slice(1).map(Number);
        const idle = parts[3] + parts[4]; // idle + iowait
        const total = parts.reduce((a, b) => a + b, 0);
        return { idle, total };
      };

      const s1 = parse(stat1);
      const s2 = parse(stat2);
      const idleDiff = s2.idle - s1.idle;
      const totalDiff = s2.total - s1.total;
      cpuUsage = totalDiff > 0 ? Math.round((1 - idleDiff / totalDiff) * 100) : 0;
    } catch {
      // Fallback: use os.loadavg
      const loadAvg = os.loadavg()[0];
      cpuUsage = Math.min(100, Math.round((loadAvg / cpuCount) * 100));
    }

    // Memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);

    // Storage info - check root partition
    let storageUsage = 0;
    let storageUsed = 0;
    let storageTotal = 0;
    try {
      const dfOutput = execSync('df -B1 / 2>/dev/null').toString();
      const lines = dfOutput.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        storageTotal = parseInt(parts[1], 10);
        storageUsed = parseInt(parts[2], 10);
        storageUsage = Math.round((storageUsed / storageTotal) * 100);
      }
    } catch {
      // Storage stats unavailable
    }

    // System uptime
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;

    // Hostname
    const hostname = os.hostname();

    return {
      cpu: {
        usage: cpuUsage,
        cores: cpuCount,
        model: cpus[0]?.model || 'Unknown',
      },
      memory: {
        usage: memoryUsage,
        used: usedMem,
        total: totalMem,
        usedGiB: (usedMem / 1024 ** 3).toFixed(2),
        totalGiB: (totalMem / 1024 ** 3).toFixed(2),
      },
      storage: {
        usage: storageUsage,
        used: storageUsed,
        total: storageTotal,
        usedGiB: (storageUsed / 1024 ** 3).toFixed(2),
        totalGiB: (storageTotal / 1024 ** 3).toFixed(2),
      },
      uptime: {
        seconds: uptimeSeconds,
        formatted: uptimeStr,
      },
      hostname,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return {
      cpu: { usage: 0, cores: 1, model: 'Unknown' },
      memory: { usage: 0, used: 0, total: 0, usedGiB: '0', totalGiB: '0' },
      storage: { usage: 0, used: 0, total: 0, usedGiB: '0', totalGiB: '0' },
      uptime: { seconds: 0, formatted: '0m' },
      hostname: 'unknown',
      platform: 'unknown',
      arch: 'unknown',
      nodeVersion: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

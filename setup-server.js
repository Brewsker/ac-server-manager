#!/usr/bin/env node
/**
 * AC Server Manager - Setup Wizard Server
 *
 * Lightweight HTTP server that serves the setup wizard
 * and handles installation via the web interface
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const PORT = 3001;
const installerLogPath = '/var/log/installer.log';
let installerRunning = false;

// Serve the setup wizard HTML
function serveSetupPage(req, res) {
  const htmlPath = path.join(__dirname, 'setup-wizard.html');
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading setup page');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

// Handle installation request
async function handleInstall(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const config = JSON.parse(body);
      console.log('[Setup] Starting installation with config:', config);

      // Build installer command with environment variables
      const env = {
        ...process.env,
        NON_INTERACTIVE: 'yes',
        INSTALL_AC_SERVER: config.downloadAC ? 'yes' : 'no',
        AC_SERVER_DIR: config.acPath || '/opt/acserver',
        STEAM_USER: config.steamUser || '',
        STEAM_PASS: config.steamPass || '',
        NETWORK_MODE: config.networkMode || 'dhcp',
        STATIC_IP: config.staticIP || '',
        GATEWAY: config.gateway || '',
        BRIDGE: config.bridge || 'vmbr0',
        TERM: 'xterm',
        DEBIAN_FRONTEND: 'noninteractive',
        HOME: process.env.HOME || '/root',
        PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      };

      // Download installer script from git-cache (local) or GitHub (fallback)
      // Use nohup and redirect to /var/log/installer.log to truly background the process
      const timestamp = Date.now();
      const installerUrl = 'http://192.168.1.70/ac-server-manager/install-server.sh';
      const installCmd =
        config.installType === 'app-only'
          ? `curl -fsSL "${installerUrl}" -o /tmp/install.sh && nohup bash -c 'NON_INTERACTIVE=yes INSTALL_AC_SERVER="${
              config.downloadAC ? 'yes' : 'no'
            }" AC_SERVER_DIR="${config.acPath}" STEAM_USER="${config.steamUser}" STEAM_PASS="${
              config.steamPass
            }" bash /tmp/install.sh --app-only' >> /var/log/installer.log 2>&1 &`
          : `curl -fsSL "${installerUrl}" -o /tmp/install.sh && nohup bash -c 'NON_INTERACTIVE=yes INSTALL_AC_SERVER="${
              config.downloadAC ? 'yes' : 'no'
            }" AC_SERVER_DIR="${config.acPath}" STEAM_USER="${config.steamUser}" STEAM_PASS="${
              config.steamPass
            }" bash /tmp/install.sh' >> /var/log/installer.log 2>&1 &`;

      console.log('[Setup] Running installer...');

      // Execute the command and immediately return
      exec(installCmd, (error) => {
        if (error) {
          console.error('[Setup] Failed to start installer:', error);
        }
      });

      console.log(
        '[Setup] Installation started in background, check /var/log/installer.log for progress'
      );

      installerRunning = true;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          message: 'Installation started successfully',
          output: 'Installation running in background. Check /var/log/installer.log for progress.',
        })
      );

      // Don't exit immediately - keep server running for log streaming
      console.log('[Setup] Keeping wizard alive for log streaming...');
    } catch (error) {
      console.error('[Setup] Installation failed:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: error.message,
          output: error.stdout || error.stderr || '',
        })
      );
    }
  });
}

// Stream installer logs via Server-Sent Events
function streamLogs(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Check if installer log exists and send existing content
  if (!fs.existsSync(installerLogPath)) {
    res.write(
      `data: ${JSON.stringify({
        type: 'waiting',
        message: 'Waiting for installation to start...',
      })}\n\n`
    );
  } else {
    // Send existing log content first
    try {
      const existingLog = fs.readFileSync(installerLogPath, 'utf8');
      const lines = existingLog.split('\n').filter((line) => line.trim());
      lines.forEach((line) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message: line })}\n\n`);
      });
      
      // Check if already complete
      if (existingLog.includes('SETUP_WIZARD_COMPLETE')) {
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        installerRunning = false;
        return; // Don't start tail if already complete
      }
    } catch (err) {
      console.error('[SSE] Error reading existing log:', err);
    }
  }

  // Use tail -f to follow the log for new lines
  const tail = spawn('tail', ['-f', '-n', '0', installerLogPath]);

  tail.stdout.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line) => line.trim());
    lines.forEach((line) => {
      res.write(`data: ${JSON.stringify({ type: 'log', message: line })}\n\n`);

      // Check for completion markers
      if (line.includes('SETUP_WIZARD_COMPLETE') || line.includes('Installation Complete')) {
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        installerRunning = false;
        setTimeout(() => tail.kill(), 1000);
      }
    });
  });

  tail.stderr.on('data', (data) => {
    console.error('[SSE] Tail error:', data.toString());
  });

  req.on('close', () => {
    tail.kill();
    console.log('[SSE] Client disconnected');
  });
}

// Handle wizard update from git-cache
function handleUpdate(req, res) {
  console.log('[Setup] Update wizard requested');

  // Check if git-cache is accessible
  exec('curl -s http://192.168.1.70/ac-server-manager/setup-wizard.html -o /dev/null', (error) => {
    if (error) {
      console.error('[Setup] Git-cache not accessible:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: 'Git-cache server not accessible at 192.168.1.70',
        })
      );
      return;
    }

    // Download latest files from git-cache
    const updateCmd = `
      curl -fsSL http://192.168.1.70/ac-server-manager/setup-wizard.html -o /tmp/setup-wizard.html && 
      curl -fsSL http://192.168.1.70/ac-server-manager/setup-server.js -o /tmp/setup-server.js
    `;

    console.log('[Setup] Downloading latest code from git-cache...');

    exec(updateCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('[Setup] Update failed:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            message: 'Failed to download latest code: ' + stderr,
          })
        );
        return;
      }

      console.log('[Setup] Update successful, wizard will reload');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          message: 'Wizard updated successfully',
        })
      );

      // Restart the wizard server after a short delay
      setTimeout(() => {
        console.log('[Setup] Restarting wizard with updated code...');
        process.exit(0); // systemd will restart it
      }, 1000);
    });
  });
}

// Simple router
const server = http.createServer((req, res) => {
  console.log(`[Setup] ${req.method} ${req.url}`);

  if (req.url === '/' || req.url === '/setup') {
    serveSetupPage(req, res);
  } else if (req.url === '/setup/install' && req.method === 'POST') {
    handleInstall(req, res);
  } else if (req.url === '/setup/update' && req.method === 'POST') {
    handleUpdate(req, res);
  } else if (req.url === '/setup/logs') {
    streamLogs(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Get local IP address for display
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏎️  AC Server Manager - Setup Wizard                   ║
║                                                           ║
║   Setup wizard is running at:                            ║
║   http://localhost:${PORT}                                    ║
║   http://${localIP}:${PORT}                               ║
║                                                           ║
║   Open either URL in your browser to begin setup         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

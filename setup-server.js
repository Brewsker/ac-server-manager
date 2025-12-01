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
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const PORT = 3001;

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
      };

      // Download and run installer
      const installCmd =
        config.installType === 'app-only'
          ? 'curl -fsSL https://raw.githubusercontent.com/Brewsker/ac-server-manager/main/install-server.sh | bash -s -- --app-only'
          : 'curl -fsSL https://raw.githubusercontent.com/Brewsker/ac-server-manager/main/install-server.sh | bash';

      console.log('[Setup] Running installer...');
      const { stdout, stderr } = await execAsync(installCmd, { env });

      console.log('[Setup] Installation complete!');
      console.log('STDOUT:', stdout);
      if (stderr) console.log('STDERR:', stderr);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          message: 'Installation completed successfully',
          output: stdout,
        })
      );

      // Exit after sending response - PM2 will restart with the actual app
      setTimeout(() => {
        console.log('[Setup] Exiting setup server, PM2 will restart with main app...');
        process.exit(0);
      }, 2000);
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

// Simple router
const server = http.createServer((req, res) => {
  console.log(`[Setup] ${req.method} ${req.url}`);

  if (req.url === '/' || req.url === '/setup') {
    serveSetupPage(req, res);
  } else if (req.url === '/setup/install' && req.method === 'POST') {
    handleInstall(req, res);
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

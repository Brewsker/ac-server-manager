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
      const installerUrl = 'http://192.168.1.70/ac-server-manager/scripts/install/install-server.sh';

      // Build environment variables string (properly escaped for shell)
      const envVars = [
        'NON_INTERACTIVE=yes',
        `INSTALL_AC_SERVER=${config.downloadAC ? 'yes' : 'no'}`,
        `AC_SERVER_DIR=${config.acPath || '/opt/acserver'}`,
        `STEAM_USER=${config.steamUser || ''}`,
        `STEAM_PASS=${config.steamPass || ''}`,
      ].join(' ');

      const appOnlyFlag = config.installType === 'app-only' ? ' --app-only' : '';

      // Simple command without nested bash -c
      const installCmd = `curl -fsSL "${installerUrl}" -o /tmp/install.sh && ${envVars} bash /tmp/install.sh${appOnlyFlag} >> /var/log/installer.log 2>&1 &`;

      console.log('[Setup] Running installer...');
      console.log('[Setup] Command:', installCmd);

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

  // Wait for log file to exist
  const waitForLog = () => {
    if (!fs.existsSync(installerLogPath)) {
      res.write(
        `data: ${JSON.stringify({
          type: 'waiting',
          message: 'Waiting for installation to start...',
        })}\n\n`
      );
      // Check again in 1 second
      setTimeout(() => {
        if (!fs.existsSync(installerLogPath)) {
          waitForLog();
        } else {
          startTailing();
        }
      }, 1000);
      return;
    }
    startTailing();
  };

  const startTailing = () => {
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

    // Now follow only NEW lines (don't re-read what we already sent)
    startTailFollow();
  };

  const startTailFollow = () => {
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

          // Disable and stop wizard service after installation completes
          console.log('[Setup] Installation complete - disabling wizard service');
          setTimeout(() => {
            exec('systemctl disable ac-setup-wizard && systemctl stop ac-setup-wizard', (error) => {
              if (error) {
                console.error('[Setup] Failed to disable wizard service:', error);
                // Exit anyway to free port for PM2 app
                process.exit(0);
              } else {
                console.log('[Setup] Wizard service disabled - PM2 app should now be accessible');
                process.exit(0);
              }
            });
          }, 5000);
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
  };

  waitForLog();
}

// Handle wizard update from git-cache
// Add health check endpoint
function handleHealth(req, res) {
  // Check if installation is complete
  const fs = require('fs');
  let installComplete = false;

  try {
    if (fs.existsSync(installerLogPath)) {
      const logContent = fs.readFileSync(installerLogPath, 'utf8');
      installComplete = logContent.includes('SETUP_WIZARD_COMPLETE');
    }
  } catch (err) {
    console.error('[Health] Error checking installation status:', err);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'ok',
      installationComplete: installComplete,
      installerRunning: installerRunning,
    })
  );

  // If installation is complete, disable and stop wizard service
  // The wizard service ExecStopPost will restart PM2 after wizard fully stops
  if (installComplete && !installerRunning) {
    console.log('[Health] Installation detected as complete - disabling wizard');
    setTimeout(() => {
      exec('systemctl disable ac-setup-wizard && systemctl stop ac-setup-wizard', (error) => {
        if (error) {
          console.error('[Health] Failed to disable/stop wizard:', error);
        }
        console.log('[Health] Wizard stopping - ExecStopPost will restart PM2');
        process.exit(0);
      });
    }, 2000);
  }
}

// Simple router
const server = http.createServer((req, res) => {
  console.log(`[Setup] ${req.method} ${req.url}`);

  if (req.url === '/' || req.url === '/setup') {
    serveSetupPage(req, res);
  } else if (req.url === '/setup/install' && req.method === 'POST') {
    handleInstall(req, res);
  } else if (req.url === '/setup/logs') {
    streamLogs(req, res);
  } else if (req.url === '/health') {
    handleHealth(req, res);
  } else {
    // Redirect any other path to root (catches /config, etc.)
    res.writeHead(302, { Location: '/' });
    res.end();
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

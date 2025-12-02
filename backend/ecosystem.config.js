module.exports = {
  apps: [{
    name: 'ac-server-manager',
    script: './src/server.js',
    cwd: '/opt/ac-server-manager/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/opt/ac-server-manager/backend/logs/error.log',
    out_file: '/opt/ac-server-manager/backend/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};

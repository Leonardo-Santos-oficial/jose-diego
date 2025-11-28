module.exports = {
  apps: [
    {
      name: 'aviator-engine',
      script: './dist/index.js',
      cwd: '/var/www/aviator-engine',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      error_file: '/var/log/aviator/error.log',
      out_file: '/var/log/aviator/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};

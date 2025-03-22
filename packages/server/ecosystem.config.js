module.exports = {
  apps: [
    {
      name: 'heyform',
      script: 'dist/main.js',
      watch: false,
			node_args: "-r tsconfig-paths/register",
      cwd: ".",
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'development',
        NO_COLOR: 'true'
      },
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,
      merge_logs: true
    }
  ]
}

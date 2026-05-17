module.exports = {
  apps: [
    {
      name: 'shop-backend',
      script: 'npm',
      args: 'start',
      cwd: './backend',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'shop-tg-bot',
      script: 'npm',
      args: 'start',
      cwd: './tg',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

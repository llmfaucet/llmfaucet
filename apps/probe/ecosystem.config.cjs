module.exports = {
  apps: [
    {
      name: 'llmfaucet-probe',
      script: 'src/index.mjs',
      args: '',
      interpreter: 'node',
      env_file: '/opt/llmfaucet/.env',
      restart_delay: 5000,
      time: true,
    },
  ],
};

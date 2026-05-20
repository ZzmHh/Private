/** @type {import("pm2").StartOptions} */
module.exports = {
  apps: [
    {
      name: "fanmeng-api",
      script: "server/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      watch: false,
      env: {
        NODE_ENV: "development",
        DB_BACKEND: "json",
      },
      env_production: {
        NODE_ENV: "production",
        DB_BACKEND: "sqlite",
      },
    },
  ],
};

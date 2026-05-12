module.exports = {
  apps: [
    {
      name: "jornal-logus",
      script: "deploy/start-production.sh",
      cwd: "/var/www/jornal",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "512M",
      error_file: "/var/log/jornal-logus/error.log",
      out_file: "/var/log/jornal-logus/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};

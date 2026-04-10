require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initDb, closePool, pool } = require('./db');
const { startCrashCleanupJob } = require('./crashCleanup');

const PORT = Number(process.env.PORT) || 6767;

const server = http.createServer(app);

if (require.main === module) {
  (async () => {
    await initDb();
    if (process.env.DATABASE_URL) {
      startCrashCleanupJob(pool);
    }

    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`CloseChat API listening on port ${PORT}`);
    });
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('CloseChat API failed to start:', err);
    process.exit(1);
  });
}

// Graceful shutdown (useful for local dev + process managers)
const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down...`);

  server.close(async () => {
    try {
      await closePool();
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;


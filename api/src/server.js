require('dotenv').config();

const http = require('http');
const app = require('./app');

const PORT = Number(process.env.PORT) || 3001;

const server = http.createServer(app);

if (require.main === module) {
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`CloseChat API listening on port ${PORT}`);
  });
}

// Graceful shutdown (useful for local dev + process managers)
const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;


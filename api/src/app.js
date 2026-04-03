const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health check for the future API
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Basic error handler
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  const status = err?.statusCode || err?.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
  });
});

module.exports = app;


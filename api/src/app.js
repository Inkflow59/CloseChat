const express = require('express');
const cors = require('cors');
const crashRoutes = require('./crashRoutes');
const authRoutes = require('./authRoutes');

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: '10mb',
  }),
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth centralisée (comptes CloseChat)
app.use('/auth', authRoutes);

// Crash reporter (self-hosted)
app.use(crashRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  const status = err?.statusCode || err?.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
  });
});

module.exports = app;


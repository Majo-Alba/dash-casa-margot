
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const salesRoutes = require('./routes/salesRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

function normalizeOrigin(value = '') {
  return String(value).trim().replace(/\/+$/, '');
}

const allowedOrigins = (process.env.CLIENT_URL || '*')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests such as Render health checks / server-to-server calls may not send Origin.
    if (!origin) return callback(null, true);

    const requestOrigin = normalizeOrigin(origin);
    const isAllowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(requestOrigin);

    if (isAllowed) return callback(null, true);

    console.warn(`[CORS] blocked origin: ${requestOrigin}. Allowed: ${allowedOrigins.join(', ')}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    ok: true,
    app: 'DASH API',
    environment: process.env.NODE_ENV || 'development',
    mongodb: process.env.MONGO_URI ? mongoStates[mongoose.connection.readyState] || 'unknown' : 'not-configured',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/sales', salesRoutes);
app.use('/api/intelligence', intelligenceRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DASH server running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('[Startup] fatal error:', error);
  process.exit(1);
});


// -----> LAST FUNCTIONAL AUG26/26 <-----


// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const connectDB = require('./config/db');
// const salesRoutes = require('./routes/salesRoutes');
// const intelligenceRoutes = require('./routes/intelligenceRoutes');

// const app = express();
// const PORT = process.env.PORT || 5001;

// const allowedOrigins = (process.env.CLIENT_URL || '*')
//   .split(',')
//   .map((origin) => origin.trim())
//   .filter(Boolean);

// app.use(cors({
//   origin(origin, callback) {
//     if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     return callback(new Error('Origin not allowed by CORS'));
//   }
// }));
// app.use(express.json({ limit: '2mb' }));

// app.get('/api/health', (_req, res) => {
//   const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
//   res.json({
//     ok: true,
//     app: 'DASH API',
//     environment: process.env.NODE_ENV || 'development',
//     mongodb: process.env.MONGO_URI ? mongoStates[mongoose.connection.readyState] || 'unknown' : 'not-configured',
//     timestamp: new Date().toISOString()
//   });
// });

// app.use('/api/sales', salesRoutes);
// app.use('/api/intelligence', intelligenceRoutes);

// async function start() {
//   await connectDB();
//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`DASH server running on port ${PORT}`);
//   });
// }

// start().catch((error) => {
//   console.error('[Startup] fatal error:', error);
//   process.exit(1);
// });

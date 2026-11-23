const express = require('express');
const cors = require('cors');
const { createApiRouter } = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/validate');
const { createSupabaseClient } = require('./config/supabase');
const { createSupabaseRepository } = require('./repositories/supabaseRepository');

function createApp({ repository, now } = {}) {
  const dataRepository = repository || createSupabaseRepository(createSupabaseClient());
  const app = express();
  const defaultOrigins = process.env.NODE_ENV === 'production' ? '' : '*';
  const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins).split(',').map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && allowedOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must list explicit origins in production.');
  }
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
  }));
  app.use(express.json({ limit: '200kb' }));
  app.use('/api/v1', createApiRouter(dataRepository, now));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };

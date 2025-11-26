const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL (Railway, Heroku) and individual variables
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10, // Reduced from 20 to prevent connection exhaustion
      min: 2, // Keep minimum connections alive
      idleTimeoutMillis: 10000, // Close idle connections faster (10s instead of 30s)
      connectionTimeoutMillis: 5000, // Increased timeout (5s instead of 2s)
      acquireTimeoutMillis: 10000, // Max time to wait for connection from pool
      allowExitOnIdle: false, // Keep pool alive
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'zipmend_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 10,
      min: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      acquireTimeoutMillis: 10000,
      allowExitOnIdle: false,
    });

pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = pool;

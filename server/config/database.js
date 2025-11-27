const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL (Railway, Heroku) and individual variables
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum pool size
      min: 5, // Keep minimum connections alive to avoid cold starts
      idleTimeoutMillis: 30000, // Keep connections alive longer (30s)
      connectionTimeoutMillis: 10000, // Longer timeout for slow networks (10s)
      acquireTimeoutMillis: 20000, // More time to wait for connection (20s)
      allowExitOnIdle: false, // Keep pool alive
      keepAlive: true, // Enable TCP keepalive
      keepAliveInitialDelayMillis: 10000, // Start keepalive after 10s
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'zipmend_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 20000,
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

pool.on('connect', (client) => {
  console.log('✅ Database connected successfully');
  // Set statement timeout to prevent long-running queries
  client.query('SET statement_timeout = 30000'); // 30 seconds
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database pool error:', err.message);
  // Don't exit on pool errors - let the pool handle reconnection
  // Only log the error
});

pool.on('remove', () => {
  console.log('🔄 Database connection removed from pool');
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection test failed:', err.message);
  } else {
    console.log('✅ Database connection test successful');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

module.exports = pool;

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
  console.error('   Error code:', err.code);
  console.error('   Will attempt reconnection automatically');
  // Don't exit on pool errors - let the pool handle reconnection
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

// Retry wrapper for queries
const queryWithRetry = async (text, params, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error(`❌ Query failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Check if it's a connection error
      const isConnectionError = 
        error.message.includes('Connection terminated') ||
        error.message.includes('connection timeout') ||
        error.code === 'ECONNRESET' ||
        error.code === '57P01'; // admin_shutdown
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`   ⏳ Retrying in ${attempt}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      throw error;
    }
  }
};

// Export both pool and retry wrapper
module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;

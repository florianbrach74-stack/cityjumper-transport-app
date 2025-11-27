const { Pool } = require('pg');
require('dotenv').config();

// Check if we're in business hours (6:00-20:00 Berlin time)
const isBusinessHours = () => {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const hour = berlinTime.getHours();
  return hour >= 6 && hour < 20;
};

// Aggressive settings for business hours, relaxed for off-hours
const getPoolConfig = () => {
  const isBusiness = isBusinessHours();
  return {
    max: isBusiness ? 30 : 20, // More connections during business hours
    min: isBusiness ? 10 : 5, // Keep more connections warm
    idleTimeoutMillis: isBusiness ? 60000 : 30000, // Keep alive longer (60s vs 30s)
    connectionTimeoutMillis: isBusiness ? 15000 : 10000, // More time to connect
    acquireTimeoutMillis: isBusiness ? 30000 : 20000, // More time to acquire
    allowExitOnIdle: false,
    keepAlive: true,
    keepAliveInitialDelayMillis: isBusiness ? 5000 : 10000, // Faster keepalive
  };
};

// Support both DATABASE_URL (Railway, Heroku) and individual variables
const poolConfig = getPoolConfig();
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      ...poolConfig
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'zipmend_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ...poolConfig
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

// Connection warming - keep connections alive during business hours
let warmupInterval = null;
const startConnectionWarming = () => {
  if (warmupInterval) return;
  
  warmupInterval = setInterval(async () => {
    if (isBusinessHours()) {
      try {
        // Simple query to keep connections warm
        await pool.query('SELECT 1');
        console.log('🔥 Connection warmed (business hours)');
      } catch (error) {
        console.error('⚠️ Connection warming failed:', error.message);
      }
    }
  }, 30000); // Every 30 seconds
};

// Health check - more aggressive during business hours
let healthCheckInterval = null;
const startHealthCheck = () => {
  if (healthCheckInterval) return;
  
  healthCheckInterval = setInterval(async () => {
    const interval = isBusinessHours() ? 60000 : 300000; // 1min vs 5min
    
    try {
      const start = Date.now();
      await pool.query('SELECT NOW()');
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow DB response: ${duration}ms`);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      // Try to recover
      try {
        await pool.query('SELECT 1');
        console.log('✅ Connection recovered');
      } catch (recoveryError) {
        console.error('❌ Recovery failed:', recoveryError.message);
      }
    }
  }, isBusinessHours() ? 60000 : 300000);
};

// Start monitoring
startConnectionWarming();
startHealthCheck();

console.log(`🕐 Database monitoring started (Business hours: ${isBusinessHours() ? 'YES' : 'NO'})`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

// Retry wrapper for queries - more aggressive during business hours
const queryWithRetry = async (text, params, maxRetries = null) => {
  // More retries during business hours
  const retries = maxRetries || (isBusinessHours() ? 5 : 3);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error(`❌ Query failed (attempt ${attempt}/${retries}):`, error.message);
      
      // Check if it's a connection error
      const isConnectionError = 
        error.message.includes('Connection terminated') ||
        error.message.includes('connection timeout') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === '57P01'; // admin_shutdown
      
      if (isConnectionError && attempt < retries) {
        // Faster retry during business hours
        const delay = isBusinessHours() ? attempt * 500 : attempt * 1000;
        console.log(`   ⏳ Retrying in ${delay}ms... (Business hours: ${isBusinessHours()})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// Export both pool and retry wrapper
module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;

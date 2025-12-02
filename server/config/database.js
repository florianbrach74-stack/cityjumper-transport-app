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
    max: isBusiness ? 10 : 5, // Reduced max connections to avoid overwhelming DB
    min: isBusiness ? 2 : 1, // Reduced min connections
    idleTimeoutMillis: isBusiness ? 60000 : 30000, // Keep alive longer (60s vs 30s)
    connectionTimeoutMillis: isBusiness ? 30000 : 20000, // More time to connect (increased)
    acquireTimeoutMillis: isBusiness ? 60000 : 40000, // More time to acquire (increased)
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
  
  // Wait 10 seconds before starting to let DB initialize
  setTimeout(() => {
    warmupInterval = setInterval(async () => {
      if (isBusinessHours()) {
        try {
          // Simple query to keep connections warm with retry
          await queryWithRetry('SELECT 1', [], 2);
          console.log('🔥 Connection warmed (business hours)');
        } catch (error) {
          console.error('⚠️ Connection warming failed:', error.message);
        }
      }
    }, 30000); // Every 30 seconds
  }, 10000);
};

// Health check - more aggressive during business hours
let healthCheckInterval = null;
const startHealthCheck = () => {
  if (healthCheckInterval) return;
  
  // Wait 15 seconds before starting to let DB initialize
  setTimeout(() => {
    healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await queryWithRetry('SELECT NOW()', [], 2);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          console.warn(`⚠️ Slow DB response: ${duration}ms`);
        } else {
          console.log(`✅ Health check passed (${duration}ms)`);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }
    }, isBusinessHours() ? 60000 : 300000); // 1min vs 5min
  }, 15000);
};

// Start monitoring (delayed to allow DB to initialize)
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
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      
      // Log successful retry
      if (attempt > 1) {
        console.log(`✅ Query succeeded on attempt ${attempt}/${retries}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error.message.includes('Connection terminated') ||
        error.message.includes('connection timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === '57P01'; // admin_shutdown
      
      if (isConnectionError && attempt < retries) {
        // Faster retry during business hours
        const delay = isBusinessHours() ? attempt * 500 : attempt * 1000;
        console.log(`⚠️ Query failed (attempt ${attempt}/${retries}): ${error.message}`);
        console.log(`   ⏳ Retrying in ${delay}ms... (Business hours: ${isBusinessHours()})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Last attempt or non-connection error
      if (attempt === retries) {
        console.error(`❌ Query failed after ${retries} attempts:`, error.message);
      }
    }
  }
  
  throw lastError;
};

// Export both pool and retry wrapper
module.exports = pool;
module.exports.pool = pool; // Also export as named export
module.exports.queryWithRetry = queryWithRetry;

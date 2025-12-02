const { Pool } = require('pg');
require('dotenv').config();

// Check if we're in business hours (6:00-20:00 Berlin time)
const isBusinessHours = () => {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const hour = berlinTime.getHours();
  return hour >= 6 && hour < 20;
};

// Reasonable settings for Railway PostgreSQL (22 connection limit on shared plan)
const getPoolConfig = () => {
  return {
    max: 10, // Reasonable for Railway shared plan
    min: 2, // Keep 2 ready
    idleTimeoutMillis: 10000, // 10 seconds
    connectionTimeoutMillis: 30000, // 30 seconds
    acquireTimeoutMillis: 30000, // 30 seconds
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
};

// Support both DATABASE_URL (Railway, Heroku) and individual variables
const poolConfig = getPoolConfig();
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        // Support PostgreSQL 17.6 TLS requirements
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
      } : false,
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

// Test connection on startup - non-blocking with timeout
setTimeout(async () => {
  try {
    const result = await Promise.race([
      pool.query('SELECT NOW()'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection test timeout')), 15000))
    ]);
    console.log('✅ Database connection test successful');
  } catch (err) {
    console.error('⚠️  Database connection test failed:', err.message);
    console.log('ℹ️  Server will continue - connections will retry automatically');
  }
}, 5000); // Wait 5 seconds before testing to let Railway DB fully start

// Connection warming - DISABLED to reduce load
// Railway PostgreSQL handles connection pooling internally
let warmupInterval = null;
const startConnectionWarming = () => {
  // Disabled - causing too many connections
  console.log('ℹ️  Connection warming disabled (Railway handles pooling)');
};

// Health check - minimal frequency to reduce load
let healthCheckInterval = null;
const startHealthCheck = () => {
  if (healthCheckInterval) return;
  
  // Wait 60 seconds before starting to let DB initialize
  setTimeout(() => {
    healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await pool.query('SELECT 1'); // Direct query, no retry for health check
        const duration = Date.now() - start;
        
        if (duration > 2000) {
          console.warn(`⚠️ Slow DB response: ${duration}ms`);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }
    }, 600000); // Every 10 minutes only
  }, 60000);
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

// Retry wrapper for queries - reduced retries to prevent pool exhaustion
const queryWithRetry = async (text, params, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      
      // Log successful retry
      if (attempt > 1) {
        console.log(`✅ Query succeeded on attempt ${attempt}/${maxRetries}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error.message.includes('Connection terminated') ||
        error.message.includes('connection timeout') ||
        error.message.includes('timeout exceeded') ||
        error.message.includes('ECONNREFUSED') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === '57P01'; // admin_shutdown
      
      if (isConnectionError && attempt < maxRetries) {
        const delay = attempt * 1000; // 1s, 2s
        console.log(`⚠️ Query failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
        console.log(`   ⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Last attempt or non-connection error - don't spam logs
      if (attempt === maxRetries && isConnectionError) {
        console.error(`❌ Query failed after ${maxRetries} attempts:`, error.message);
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

// Export both pool and retry wrapper
module.exports = pool;
module.exports.pool = pool; // Also export as named export
module.exports.queryWithRetry = queryWithRetry;

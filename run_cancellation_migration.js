const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Connecting to Railway database...');
    
    const sqlPath = path.join(__dirname, 'add_cancellation_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing cancellation system migration...');
    await client.query(sql);
    
    console.log('✅ Cancellation system migration completed successfully!');
    console.log('\n📦 New features:');
    console.log('  ✓ Cancellation tracking columns added');
    console.log('  ✓ Cancellation fee calculation');
    console.log('  ✓ Contractor penalty system');
    console.log('  ✓ Customer compensation tracking');
    console.log('  ✓ Cancellation history audit table');
    console.log('\n🎯 Cancellation rules from AGB:');
    console.log('  Customer cancellation:');
    console.log('    - >24h before pickup: Free');
    console.log('    - <24h before pickup: 50% fee');
    console.log('    - Driver en route: 75% fee');
    console.log('  Contractor cancellation:');
    console.log('    - Contractor gets penalty');
    console.log('    - Customer can be compensated');
    console.log('    - Admin manages the process');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

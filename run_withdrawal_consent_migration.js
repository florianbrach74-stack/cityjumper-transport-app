const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Connecting to database...');
    
    const sqlPath = path.join(__dirname, 'add_withdrawal_consent.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing withdrawal consent migration...');
    await client.query(sql);
    
    console.log('✅ Withdrawal consent migration completed successfully!');
    console.log('\n📦 New features:');
    console.log('  ✓ withdrawal_consent_given column added');
    console.log('  ✓ withdrawal_consent_timestamp column added');
    console.log('  ✓ withdrawal_consent_ip column added');
    console.log('\n🎯 Customer orders now track withdrawal right consent');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

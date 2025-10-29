const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    
    const sqlFile = path.join(__dirname, 'add_waiting_time_columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Running migration...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name LIKE '%waiting%'
      ORDER BY column_name;
    `);
    
    console.log('\n📊 New columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

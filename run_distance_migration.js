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
    
    const sqlFile = path.join(__dirname, 'add_distance_duration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Adding distance and duration columns...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('distance_km', 'duration_minutes')
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

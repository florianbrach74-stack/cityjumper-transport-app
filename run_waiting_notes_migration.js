const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    
    const sqlFile = path.join(__dirname, 'add_waiting_notes_columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Adding pickup_waiting_notes and delivery_waiting_notes columns...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Check if columns were added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('pickup_waiting_notes', 'delivery_waiting_notes');
    `);
    
    console.log('✅ Columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

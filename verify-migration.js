const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration columns...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('needs_loading_help', 'needs_unloading_help', 'loading_help_fee', 'legal_delivery')
      ORDER BY column_name
    `);
    
    console.log('');
    if (result.rows.length === 0) {
      console.log('❌ Migration columns NOT found!');
      console.log('   The migration needs to be run.');
    } else {
      console.log('✅ Migration successful! Found columns:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name} (${row.data_type}) - Default: ${row.column_default || 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyMigration();

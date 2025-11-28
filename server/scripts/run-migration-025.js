const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running migration 025: Add discount and skonto columns...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/025_add_invoice_discount_skonto.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    
    console.log('✅ Migration 025 completed successfully!');
    
    // Verify columns exist
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'sent_invoices'
        AND column_name IN ('discount_percentage', 'discount_amount', 'skonto_offered', 'skonto_percentage')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Added columns:');
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

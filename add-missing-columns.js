const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function addColumns() {
  console.log('🔄 Füge fehlende Spalten hinzu...\n');
  
  try {
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS hours_before_pickup DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS customer_cancellation_fee DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS contractor_compensation DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS available_budget DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS adjusted_contractor_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS platform_profit_from_cancellation DECIMAL(10,2) DEFAULT 0
    `);
    
    console.log('✅ Spalten hinzugefügt!\n');
    
    // Verifizierung
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'transport_orders' 
        AND (column_name LIKE '%cancel%' 
             OR column_name LIKE '%penalty%'
             OR column_name LIKE '%budget%'
             OR column_name LIKE '%compensation%')
      ORDER BY column_name
    `);
    
    console.log('📋 Alle Stornierungsspalten:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🎉 Stornierungssystem bereit!\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

addColumns();

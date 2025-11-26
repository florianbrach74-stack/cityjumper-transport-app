const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🔄 Starte Stornierungssystem-Migration...\n');
  
  try {
    const sql = fs.readFileSync('./migrations/add-cancellation-system.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('✅ Migration erfolgreich!');
    console.log('\n📊 Neue Spalten:');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'transport_orders' 
        AND column_name LIKE '%cancel%'
        OR column_name IN ('available_budget', 'adjusted_contractor_price', 'platform_profit_from_cancellation')
      ORDER BY column_name
    `);
    
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n✅ Stornierungssystem bereit!\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();

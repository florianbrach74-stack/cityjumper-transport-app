const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  console.log('\n🔍 Prüfe DB Spalten\n');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('pickup_stops', 'delivery_stops', 'extra_stops_count', 'extra_stops_fee')
      ORDER BY column_name
    `);
    
    console.log('📋 Spalten in transport_orders:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name} (${row.data_type})`);
    });
    
    if (result.rows.length < 4) {
      console.log('\n❌ FEHLER: Nicht alle Spalten vorhanden!');
      console.log('   Erwartete Spalten: pickup_stops, delivery_stops, extra_stops_count, extra_stops_fee');
    } else {
      console.log('\n✅ Alle Multi-Stop Spalten vorhanden!');
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();

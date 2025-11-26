const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const result = await pool.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'transport_orders' 
      AND (column_name LIKE '%cancel%' 
           OR column_name LIKE '%penalty%'
           OR column_name LIKE '%budget%'
           OR column_name LIKE '%compensation%')
    ORDER BY column_name
  `);
  
  console.log('📋 Bestehende Stornierungsspalten:\n');
  result.rows.forEach(row => {
    console.log(`  ${row.column_name} (${row.data_type})`);
  });
  
  console.log('\n📝 Fehlende Spalten für neues System:');
  const needed = [
    'hours_before_pickup',
    'contractor_penalty',
    'customer_cancellation_fee',
    'contractor_compensation',
    'available_budget',
    'adjusted_contractor_price',
    'platform_profit_from_cancellation'
  ];
  
  const existing = result.rows.map(r => r.column_name);
  needed.forEach(col => {
    if (!existing.includes(col)) {
      console.log(`  ❌ ${col}`);
    } else {
      console.log(`  ✅ ${col}`);
    }
  });
  
  await pool.end();
}

check();

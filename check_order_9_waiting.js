const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkOrder9() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        pickup_waiting_minutes,
        delivery_waiting_minutes,
        waiting_time_notes,
        pickup_waiting_notes,
        delivery_waiting_notes,
        waiting_time_fee,
        status
      FROM transport_orders
      WHERE id = 9;
    `);
    
    console.log('📦 Auftrag #9 Wartezeit-Daten:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder9();

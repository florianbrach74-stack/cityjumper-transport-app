const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function fixOrder9() {
  try {
    console.log('🔧 Fixing Order #9 waiting notes...');
    
    // Split the combined notes manually for this specific order
    await pool.query(`
      UPDATE transport_orders
      SET 
        pickup_waiting_notes = 'Musste noch gekocht werden',
        delivery_waiting_notes = 'Suchen der kunden'
      WHERE id = 9;
    `);
    
    console.log('✅ Order #9 notes fixed!');
    
    // Verify
    const result = await pool.query(`
      SELECT 
        id,
        pickup_waiting_minutes,
        delivery_waiting_minutes,
        pickup_waiting_notes,
        delivery_waiting_notes
      FROM transport_orders
      WHERE id = 9;
    `);
    
    console.log('\n📦 Updated data:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixOrder9();

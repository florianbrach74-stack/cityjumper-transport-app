const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkOrder() {
  try {
    const result = await pool.query(`
      SELECT id, pickup_city, delivery_city, distance_km, duration_minutes, route_geometry IS NOT NULL as has_route
      FROM transport_orders 
      WHERE id = 9;
    `);
    
    console.log('Order #9 data:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder();

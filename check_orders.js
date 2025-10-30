const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkOrders() {
  try {
    // Check lucy flader user
    const userResult = await pool.query(`
      SELECT id, email, role, verification_status, account_status
      FROM users 
      WHERE email = 'lucy@flader.de';
    `);
    
    console.log('👤 Lucy Flader Account:');
    console.log(userResult.rows[0]);
    console.log('');
    
    // Check all orders
    const ordersResult = await pool.query(`
      SELECT 
        id, 
        status, 
        customer_id,
        contractor_id,
        pickup_city,
        delivery_city,
        price,
        created_at
      FROM orders
      ORDER BY created_at DESC;
    `);
    
    console.log('📦 Alle Aufträge in der Datenbank:');
    console.log(`Total: ${ordersResult.rows.length} Aufträge\n`);
    
    ordersResult.rows.forEach(order => {
      console.log(`ID: ${order.id} | Status: ${order.status}`);
      console.log(`  Route: ${order.pickup_city} → ${order.delivery_city}`);
      console.log(`  Preis: €${order.price}`);
      console.log(`  Kunde: ${order.customer_id} | Auftragnehmer: ${order.contractor_id || 'keiner'}`);
      console.log(`  Erstellt: ${order.created_at}`);
      console.log('');
    });
    
    // Check pending orders (should be visible to contractors)
    const pendingResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = 'pending';
    `);
    
    console.log(`🔍 Verfügbare Aufträge (Status: pending): ${pendingResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrders();

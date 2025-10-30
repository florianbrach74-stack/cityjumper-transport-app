const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkTransportOrders() {
  try {
    // Check all transport orders
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
      FROM transport_orders
      ORDER BY created_at DESC;
    `);
    
    console.log('📦 Alle Transport-Aufträge:');
    console.log(`Total: ${ordersResult.rows.length} Aufträge\n`);
    
    if (ordersResult.rows.length === 0) {
      console.log('❌ KEINE AUFTRÄGE IN DER DATENBANK!\n');
    } else {
      ordersResult.rows.forEach(order => {
        console.log(`ID: ${order.id} | Status: ${order.status}`);
        console.log(`  Route: ${order.pickup_city} → ${order.delivery_city}`);
        console.log(`  Preis: €${order.price}`);
        console.log(`  Kunde: ${order.customer_id} | Auftragnehmer: ${order.contractor_id || 'keiner'}`);
        console.log(`  Erstellt: ${order.created_at}`);
        console.log('');
      });
    }
    
    // Check pending orders
    const pendingResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM transport_orders
      WHERE status = 'pending';
    `);
    
    console.log(`🔍 Verfügbare Aufträge (Status: pending): ${pendingResult.rows[0].count}`);
    
    // Check if lucy flader has any assigned orders
    const lucyOrders = await pool.query(`
      SELECT COUNT(*) as count
      FROM transport_orders
      WHERE contractor_id = 4;
    `);
    
    console.log(`👷 Lucy Flader zugewiesene Aufträge: ${lucyOrders.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTransportOrders();

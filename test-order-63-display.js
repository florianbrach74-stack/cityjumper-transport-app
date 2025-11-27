const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder63Display() {
  console.log('\n🔍 Prüfe Auftrag #63 für Contractor-Anzeige\n');
  
  try {
    // Simulate what the contractor dashboard query does
    const result = await pool.query(`
      SELECT 
        o.*,
        c.email as customer_email,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE o.id = 63
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Auftrag #63 nicht gefunden');
      return;
    }
    
    const order = result.rows[0];
    
    console.log('📋 Raw Database Data:');
    console.log(`   delivery_stops type: ${typeof order.delivery_stops}`);
    console.log(`   delivery_stops value:`, order.delivery_stops);
    console.log(`   pickup_stops type: ${typeof order.pickup_stops}`);
    console.log(`   pickup_stops value:`, order.pickup_stops);
    
    // Test the parsing logic from ContractorDashboard
    console.log('\n🔍 Testing ContractorDashboard Logic:');
    
    const deliveryStops = order.delivery_stops 
      ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
      : [];
    
    const pickupStops = order.pickup_stops
      ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
      : [];
    
    const hasMultiStop = pickupStops.length > 0 || deliveryStops.length > 0;
    
    console.log(`   pickupStops.length: ${pickupStops.length}`);
    console.log(`   deliveryStops.length: ${deliveryStops.length}`);
    console.log(`   hasMultiStop: ${hasMultiStop}`);
    
    if (hasMultiStop) {
      const totalAddresses = pickupStops.length + deliveryStops.length + 2;
      console.log(`\n✅ Multi-Stop Badge SOLLTE angezeigt werden:`);
      console.log(`   🚚 MULTI-STOP: ${totalAddresses} Adressen`);
      
      const allPLZ = [
        order.pickup_postal_code,
        ...pickupStops.map(s => s.postal_code),
        order.delivery_postal_code,
        ...deliveryStops.map(s => s.postal_code)
      ];
      console.log(`   Alle PLZ: ${allPLZ.join(' → ')}`);
    } else {
      console.log(`\n❌ Multi-Stop Badge wird NICHT angezeigt`);
      console.log(`   Grund: Keine Stops gefunden`);
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkOrder63Display();

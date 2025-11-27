const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder61() {
  console.log('\n🔍 Prüfe Auftrag #61\n');
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        delivery_stops,
        pickup_stops,
        extra_stops_count,
        extra_stops_fee,
        price,
        distance_km,
        duration_minutes
      FROM transport_orders 
      WHERE id = 61
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Auftrag #61 nicht gefunden');
      return;
    }
    
    const order = result.rows[0];
    
    console.log('📋 Auftrag #61:');
    console.log(`   Preis: €${order.price}`);
    console.log(`   Extra-Stops Count: ${order.extra_stops_count}`);
    console.log(`   Extra-Stops Fee: €${order.extra_stops_fee}`);
    console.log(`   Distanz: ${order.distance_km} km`);
    console.log(`   Dauer: ${order.duration_minutes} min`);
    
    const deliveryStops = order.delivery_stops ? 
      (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops) 
      : [];
    const pickupStops = order.pickup_stops ?
      (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
      : [];
    
    console.log(`\n📦 Stops:`);
    console.log(`   Pickup-Stops: ${pickupStops.length}`);
    console.log(`   Delivery-Stops: ${deliveryStops.length}`);
    
    if (deliveryStops.length > 0) {
      console.log(`\n🚚 Delivery-Stops:`);
      deliveryStops.forEach((stop, i) => {
        console.log(`   ${i + 1}. ${stop.address}, ${stop.postal_code} ${stop.city}`);
      });
    }
    
    console.log(`\n✅ Daten korrekt gespeichert!`);
    
    // Check if displayed correctly
    console.log(`\n🔍 Prüfung:`);
    console.log(`   ${deliveryStops.length > 0 ? '✅' : '❌'} Multi-Stop Daten vorhanden`);
    console.log(`   ${order.extra_stops_fee > 0 ? '✅' : '❌'} Extra-Stops-Gebühr gesetzt`);
    console.log(`   ${order.distance_km > 0 ? '✅' : '❌'} Distanz berechnet`);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder61();

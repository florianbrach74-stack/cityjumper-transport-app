const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder62() {
  console.log('\n🔍 Prüfe Auftrag #62\n');
  
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
      WHERE id = 62
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Auftrag #62 nicht gefunden');
      return;
    }
    
    const order = result.rows[0];
    
    console.log('📋 Auftrag #62:');
    console.log(`   Preis: €${order.price}`);
    console.log(`   Extra-Stops Count: ${order.extra_stops_count}`);
    console.log(`   Extra-Stops Fee: €${order.extra_stops_fee}`);
    console.log(`   Distanz: ${order.distance_km} km`);
    console.log(`   Dauer: ${order.duration_minutes} min`);
    
    console.log(`\n📦 Raw Data:`);
    console.log(`   delivery_stops type: ${typeof order.delivery_stops}`);
    console.log(`   delivery_stops value:`, order.delivery_stops);
    
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
    
    console.log(`\n🔍 Prüfung:`);
    console.log(`   ${deliveryStops.length > 0 ? '✅' : '❌'} Multi-Stop Daten vorhanden`);
    console.log(`   ${order.extra_stops_fee > 0 ? '✅' : '❌'} Extra-Stops-Gebühr gesetzt (€${order.extra_stops_fee})`);
    console.log(`   ${order.extra_stops_count > 0 ? '✅' : '❌'} Extra-Stops-Count gesetzt (${order.extra_stops_count})`);
    
    if (deliveryStops.length > 0 && order.extra_stops_fee > 0) {
      console.log(`\n✅ ALLES KORREKT! Multi-Stop wurde gespeichert!`);
    } else {
      console.log(`\n❌ Problem: Daten wurden nicht korrekt gespeichert`);
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder62();

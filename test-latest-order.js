const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLatestOrder() {
  console.log('\n🔍 Prüfe neuesten Auftrag\n');
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        pickup_postal_code,
        delivery_postal_code,
        delivery_stops,
        pickup_stops,
        extra_stops_count,
        extra_stops_fee,
        price,
        distance_km,
        duration_minutes,
        created_at
      FROM transport_orders 
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Keine Aufträge gefunden');
      return;
    }
    
    const order = result.rows[0];
    
    console.log(`📋 Auftrag #${order.id}:`);
    console.log(`   Erstellt: ${order.created_at}`);
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
    
    console.log(`\n🚚 Route:`);
    console.log(`   Start: PLZ ${order.pickup_postal_code}`);
    
    if (pickupStops.length > 0) {
      pickupStops.forEach((stop, i) => {
        console.log(`   ${i + 2}. Abholung: ${stop.address}, PLZ ${stop.postal_code} ${stop.city}`);
      });
    }
    
    console.log(`   ${pickupStops.length + 2}. Zustellung: PLZ ${order.delivery_postal_code}`);
    
    if (deliveryStops.length > 0) {
      deliveryStops.forEach((stop, i) => {
        console.log(`   ${pickupStops.length + i + 3}. Zustellung: ${stop.address}, PLZ ${stop.postal_code} ${stop.city}`);
      });
    }
    
    console.log(`\n🔍 Prüfung:`);
    const hasMultiStop = deliveryStops.length > 0 || pickupStops.length > 0;
    console.log(`   ${hasMultiStop ? '✅' : '❌'} Multi-Stop Daten vorhanden`);
    console.log(`   ${order.extra_stops_fee > 0 ? '✅' : '❌'} Extra-Stops-Gebühr gesetzt (€${order.extra_stops_fee})`);
    console.log(`   ${order.distance_km > 0 ? '✅' : '❌'} Distanz berechnet (${order.distance_km} km)`);
    
    if (hasMultiStop) {
      console.log(`\n✅ Multi-Stop Auftrag wurde korrekt gespeichert!`);
      console.log(`\n📍 Alle PLZ in der Route:`);
      const allPLZ = [
        order.pickup_postal_code,
        ...pickupStops.map(s => s.postal_code),
        order.delivery_postal_code,
        ...deliveryStops.map(s => s.postal_code)
      ];
      console.log(`   ${allPLZ.join(' → ')}`);
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkLatestOrder();

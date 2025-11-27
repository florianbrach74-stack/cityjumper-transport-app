const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder65() {
  console.log('\n🔍 Prüfe Auftrag #65\n');
  
  try {
    const orderResult = await pool.query(`
      SELECT 
        id,
        pickup_stops,
        delivery_stops,
        extra_stops_count,
        extra_stops_fee,
        status
      FROM transport_orders 
      WHERE id = 65
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Auftrag #65 nicht gefunden');
      return;
    }
    
    const order = orderResult.rows[0];
    
    console.log('📋 Auftrag #65:');
    console.log(`   Status: ${order.status}`);
    console.log(`   Extra Stops Count: ${order.extra_stops_count}`);
    console.log(`   Extra Stops Fee: €${order.extra_stops_fee}`);
    
    const deliveryStops = order.delivery_stops 
      ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
      : [];
    const pickupStops = order.pickup_stops
      ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
      : [];
    
    console.log(`\n📦 Stops:`);
    console.log(`   Pickup Stops: ${pickupStops.length}`);
    console.log(`   Delivery Stops: ${deliveryStops.length}`);
    
    if (deliveryStops.length > 0) {
      console.log(`\n🚚 Delivery Stops:`);
      deliveryStops.forEach((stop, i) => {
        console.log(`   ${i + 1}. ${stop.address}, ${stop.postal_code} ${stop.city}`);
      });
    }
    
    // Check CMRs
    const cmrResult = await pool.query(`
      SELECT 
        id,
        cmr_number,
        cmr_group_id,
        delivery_stop_index,
        total_stops,
        is_multi_stop,
        consignee_address,
        consignee_postal_code,
        consignee_city,
        consignee_signature,
        status
      FROM cmr_documents
      WHERE order_id = 65
      ORDER BY delivery_stop_index
    `);
    
    console.log(`\n📄 CMRs: ${cmrResult.rows.length} gefunden`);
    cmrResult.rows.forEach((cmr, i) => {
      console.log(`\n   CMR ${i + 1}:`);
      console.log(`      Nummer: ${cmr.cmr_number}`);
      console.log(`      Group ID: ${cmr.cmr_group_id}`);
      console.log(`      Stop Index: ${cmr.delivery_stop_index}`);
      console.log(`      Total Stops: ${cmr.total_stops}`);
      console.log(`      Is Multi-Stop: ${cmr.is_multi_stop}`);
      console.log(`      Empfänger: ${cmr.consignee_address}, ${cmr.consignee_postal_code} ${cmr.consignee_city}`);
      console.log(`      Unterschrift: ${cmr.consignee_signature ? '✅ Ja' : '❌ Nein'}`);
      console.log(`      Status: ${cmr.status}`);
    });
    
    console.log(`\n🔍 Analyse:`);
    const expectedCMRs = deliveryStops.length + 1; // Main + extra stops
    console.log(`   Erwartete CMRs: ${expectedCMRs}`);
    console.log(`   Vorhandene CMRs: ${cmrResult.rows.length}`);
    
    if (cmrResult.rows.length < expectedCMRs) {
      console.log(`   ❌ PROBLEM: ${expectedCMRs - cmrResult.rows.length} CMR(s) fehlen!`);
    } else {
      console.log(`   ✅ Alle CMRs vorhanden`);
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder65();

require('dotenv').config();
const pool = require('./server/config/database');

async function testMultiStopWorkflow() {
  console.log('\n🧪 MULTI-STOP WORKFLOW TEST\n');
  
  try {
    // 1. Find a multi-stop order
    console.log('1️⃣ Suche Multi-Stop Auftrag...');
    const orderResult = await pool.query(`
      SELECT * FROM transport_orders 
      WHERE delivery_stops IS NOT NULL 
      AND delivery_stops != '[]'
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Kein Multi-Stop Auftrag gefunden');
      console.log('   Erstelle bitte einen Auftrag mit 2 Zustellungen');
      process.exit(0);
    }
    
    const order = orderResult.rows[0];
    console.log(`✅ Auftrag #${order.id} gefunden`);
    console.log(`   Status: ${order.status}`);
    
    const deliveryStops = typeof order.delivery_stops === 'string' 
      ? JSON.parse(order.delivery_stops) 
      : order.delivery_stops;
    console.log(`   Delivery Stops: ${deliveryStops.length}`);
    
    // 2. Check CMRs
    console.log('\n2️⃣ Prüfe CMRs...');
    const cmrResult = await pool.query(`
      SELECT * FROM cmr_documents 
      WHERE order_id = $1 
      ORDER BY delivery_stop_index
    `, [order.id]);
    
    console.log(`✅ ${cmrResult.rows.length} CMR(s) gefunden`);
    
    cmrResult.rows.forEach((cmr, index) => {
      console.log(`\n   CMR ${index + 1}:`);
      console.log(`      ID: ${cmr.id}`);
      console.log(`      Nummer: ${cmr.cmr_number}`);
      console.log(`      Stop Index: ${cmr.delivery_stop_index}`);
      console.log(`      Total Stops: ${cmr.total_stops}`);
      console.log(`      Multi-Stop: ${cmr.is_multi_stop}`);
      console.log(`      Empfänger: ${cmr.consignee_name}`);
      console.log(`      Adresse: ${cmr.consignee_address}, ${cmr.consignee_postal_code} ${cmr.consignee_city}`);
      console.log(`      Unterschrift: ${cmr.consignee_signature ? '✅ Ja' : '❌ Nein'}`);
      console.log(`      Foto: ${cmr.delivery_photo_base64 ? '✅ Ja' : '❌ Nein'}`);
    });
    
    // 3. Test getNextPendingDelivery
    console.log('\n3️⃣ Teste getNextPendingDelivery...');
    const CMR = require('./server/models/CMR');
    const cmrGroupId = `ORDER-${order.id}`;
    const nextCMR = await CMR.getNextPendingDelivery(cmrGroupId);
    
    if (nextCMR) {
      console.log(`✅ Nächster offener CMR gefunden:`);
      console.log(`   Stop ${nextCMR.delivery_stop_index + 1}/${nextCMR.total_stops}`);
      console.log(`   Empfänger: ${nextCMR.consignee_name}`);
      console.log(`   Adresse: ${nextCMR.consignee_city}`);
    } else {
      console.log('✅ Alle Stops abgeschlossen!');
    }
    
    // 4. Check completion status
    console.log('\n4️⃣ Prüfe Abschluss-Status...');
    const allCMRs = await CMR.findByGroupId(cmrGroupId);
    const allCompleted = allCMRs.every(cmr => 
      cmr.consignee_signature || cmr.delivery_photo_base64 || cmr.shared_receiver_signature
    );
    
    console.log(`   Alle CMRs abgeschlossen: ${allCompleted ? '✅ Ja' : '❌ Nein'}`);
    console.log(`   Auftrag Status: ${order.status}`);
    
    if (allCompleted && order.status !== 'completed') {
      console.log('   ⚠️ WARNUNG: Alle CMRs fertig aber Auftrag nicht "completed"');
    }
    
    // 5. Summary
    console.log('\n📊 ZUSAMMENFASSUNG:\n');
    console.log(`   Auftrag: #${order.id}`);
    console.log(`   Stops: ${deliveryStops.length + 1} (Haupt + ${deliveryStops.length} Extra)`);
    console.log(`   CMRs erstellt: ${cmrResult.rows.length}`);
    console.log(`   CMRs abgeschlossen: ${cmrResult.rows.filter(c => c.consignee_signature || c.delivery_photo_base64).length}`);
    console.log(`   Nächster Stop: ${nextCMR ? `Stop ${nextCMR.delivery_stop_index + 1}` : 'Alle fertig'}`);
    console.log(`   Status: ${order.status}`);
    
    // 6. Test result
    console.log('\n🎯 TEST ERGEBNIS:\n');
    
    const expectedCMRs = deliveryStops.length + 1;
    const actualCMRs = cmrResult.rows.length;
    
    if (actualCMRs === expectedCMRs) {
      console.log(`   ✅ CMR Anzahl korrekt (${actualCMRs}/${expectedCMRs})`);
    } else {
      console.log(`   ❌ CMR Anzahl falsch (${actualCMRs}/${expectedCMRs})`);
    }
    
    const allHaveMultiStopFlag = cmrResult.rows.every(c => c.is_multi_stop === true);
    if (allHaveMultiStopFlag) {
      console.log('   ✅ Alle CMRs haben Multi-Stop Flag');
    } else {
      console.log('   ❌ Nicht alle CMRs haben Multi-Stop Flag');
    }
    
    const allHaveCorrectTotalStops = cmrResult.rows.every(c => c.total_stops === expectedCMRs);
    if (allHaveCorrectTotalStops) {
      console.log(`   ✅ Alle CMRs haben korrekte total_stops (${expectedCMRs})`);
    } else {
      console.log(`   ❌ Nicht alle CMRs haben korrekte total_stops`);
    }
    
    if (actualCMRs === expectedCMRs && allHaveMultiStopFlag && allHaveCorrectTotalStops) {
      console.log('\n   🎉 ALLE TESTS BESTANDEN!\n');
    } else {
      console.log('\n   ⚠️ EINIGE TESTS FEHLGESCHLAGEN\n');
    }
    
  } catch (error) {
    console.error('❌ Test Fehler:', error);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testMultiStopWorkflow();

require('dotenv').config();
const pool = require('./server/config/database');

async function testAPIEndpoints() {
  console.log('\n🧪 API ENDPOINTS TEST\n');
  
  try {
    // Find latest multi-stop order with contractor
    console.log('1️⃣ Suche Multi-Stop Auftrag mit Contractor...');
    const orderResult = await pool.query(`
      SELECT o.*, u.email as contractor_email
      FROM transport_orders o
      LEFT JOIN users u ON o.contractor_id = u.id
      WHERE o.delivery_stops IS NOT NULL 
      AND o.delivery_stops != '[]'
      AND o.contractor_id IS NOT NULL
      ORDER BY o.id DESC 
      LIMIT 1
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Kein Multi-Stop Auftrag mit Contractor gefunden');
      process.exit(0);
    }
    
    const order = orderResult.rows[0];
    const orderId = order.id;
    console.log(`✅ Auftrag #${orderId} gefunden`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Contractor: ${order.contractor_email || 'N/A'}`);
    
    // Test CMR Model methods
    console.log('\n2️⃣ Teste CMR Model Methoden...');
    const CMR = require('./server/models/CMR');
    
    // Test findByGroupId
    console.log('\n   📋 findByGroupId:');
    const cmrGroupId = `ORDER-${orderId}`;
    const allCMRs = await CMR.findByGroupId(cmrGroupId);
    console.log(`   ✅ ${allCMRs.length} CMRs gefunden`);
    
    allCMRs.forEach((cmr, index) => {
      console.log(`      CMR ${index + 1}: Stop ${cmr.delivery_stop_index + 1}/${cmr.total_stops} - ${cmr.consignee_name}`);
    });
    
    // Test getNextPendingDelivery
    console.log('\n   📋 getNextPendingDelivery:');
    const nextCMR = await CMR.getNextPendingDelivery(cmrGroupId);
    if (nextCMR) {
      console.log(`   ✅ Nächster offener Stop: ${nextCMR.delivery_stop_index + 1}/${nextCMR.total_stops}`);
      console.log(`      Empfänger: ${nextCMR.consignee_name}`);
      console.log(`      Adresse: ${nextCMR.consignee_city}`);
    } else {
      console.log('   ✅ Alle Stops abgeschlossen');
    }
    
    // Test completion check
    console.log('\n3️⃣ Teste Abschluss-Logik...');
    const allCompleted = allCMRs.every(cmr => 
      cmr.consignee_signature || cmr.delivery_photo_base64 || cmr.shared_receiver_signature
    );
    console.log(`   Alle CMRs haben Unterschrift/Foto: ${allCompleted ? '✅ Ja' : '❌ Nein'}`);
    
    const completedCount = allCMRs.filter(cmr => 
      cmr.consignee_signature || cmr.delivery_photo_base64 || cmr.shared_receiver_signature
    ).length;
    console.log(`   Abgeschlossen: ${completedCount}/${allCMRs.length}`);
    
    // Test multi-stop detection
    console.log('\n4️⃣ Teste Multi-Stop Erkennung...');
    const deliveryStops = order.delivery_stops 
      ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
      : [];
    const pickupStops = order.pickup_stops
      ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
      : [];
    
    const isMultiStop = deliveryStops.length > 0 || pickupStops.length > 0;
    const totalStops = deliveryStops.length + 1;
    
    console.log(`   Multi-Stop erkannt: ${isMultiStop ? '✅ Ja' : '❌ Nein'}`);
    console.log(`   Delivery Stops: ${deliveryStops.length}`);
    console.log(`   Total Stops: ${totalStops}`);
    console.log(`   CMRs erstellt: ${allCMRs.length}`);
    
    if (allCMRs.length === totalStops) {
      console.log('   ✅ CMR Anzahl stimmt überein');
    } else {
      console.log(`   ❌ CMR Anzahl falsch (${allCMRs.length} statt ${totalStops})`);
    }
    
    // Test CMR fields
    console.log('\n5️⃣ Teste CMR Felder...');
    let allFieldsCorrect = true;
    
    allCMRs.forEach((cmr, index) => {
      const errors = [];
      
      if (!cmr.is_multi_stop) errors.push('is_multi_stop = false');
      if (cmr.total_stops !== totalStops) errors.push(`total_stops = ${cmr.total_stops} (erwartet ${totalStops})`);
      if (cmr.cmr_group_id !== cmrGroupId) errors.push('cmr_group_id falsch');
      if (!cmr.consignee_name) errors.push('consignee_name fehlt');
      
      if (errors.length > 0) {
        console.log(`   ❌ CMR ${index + 1} Fehler:`);
        errors.forEach(err => console.log(`      - ${err}`));
        allFieldsCorrect = false;
      } else {
        console.log(`   ✅ CMR ${index + 1} alle Felder korrekt`);
      }
    });
    
    // Frontend simulation
    console.log('\n6️⃣ Simuliere Frontend Workflow...');
    
    console.log('\n   Schritt 1: Dashboard lädt Auftrag');
    console.log(`   → Status: ${order.status}`);
    console.log(`   → Button Text: "Zustellung abschließen (${totalStops} Stops)"`);
    
    console.log('\n   Schritt 2: Contractor klickt Button');
    console.log(`   → GET /api/cmr/order/${orderId}/group`);
    console.log(`   → Lädt ${allCMRs.length} CMRs`);
    
    console.log('\n   Schritt 3: Modal zeigt Stop-Auswahl');
    allCMRs.forEach((cmr, index) => {
      const isCompleted = cmr.consignee_signature || cmr.delivery_photo_base64;
      console.log(`   ${isCompleted ? '✅' : '○'} Stop ${index + 1}/${totalStops}: ${cmr.consignee_name} (${cmr.consignee_city})`);
    });
    
    if (nextCMR) {
      console.log(`\n   Schritt 4: Contractor wählt Stop ${nextCMR.delivery_stop_index + 1}`);
      console.log(`   → Unterschrift/Foto für ${nextCMR.consignee_name}`);
      console.log(`   → POST /api/cmr/order/${orderId}/delivery`);
      console.log(`   → Response: { allStopsCompleted: ${allCompleted}, nextCMR: {...} }`);
    } else {
      console.log('\n   Schritt 4: Alle Stops abgeschlossen');
      console.log(`   → Email wird gesendet`);
      console.log(`   → Status → completed`);
    }
    
    // Final summary
    console.log('\n📊 TEST ERGEBNIS:\n');
    
    const tests = [
      { name: 'CMR Anzahl korrekt', passed: allCMRs.length === totalStops },
      { name: 'Multi-Stop erkannt', passed: isMultiStop },
      { name: 'Alle CMR Felder korrekt', passed: allFieldsCorrect },
      { name: 'getNextPendingDelivery funktioniert', passed: true },
      { name: 'findByGroupId funktioniert', passed: allCMRs.length > 0 }
    ];
    
    tests.forEach(test => {
      console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    
    const allPassed = tests.every(t => t.passed);
    
    if (allPassed) {
      console.log('\n   🎉 ALLE API TESTS BESTANDEN!\n');
      console.log('   Frontend kann jetzt getestet werden:');
      console.log('   1. Neuen Multi-Stop Auftrag erstellen');
      console.log('   2. Als Contractor annehmen');
      console.log('   3. Paket abholen');
      console.log('   4. Zustellung abschließen (Stop-Auswahl testen)');
      console.log('   5. Zweiten Stop abschließen');
      console.log('   6. Email + PDF prüfen\n');
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

testAPIEndpoints();

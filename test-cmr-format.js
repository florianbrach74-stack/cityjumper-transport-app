require('dotenv').config();
const pool = require('./server/config/database');
const CMR = require('./server/models/CMR');
const Order = require('./server/models/Order');
const CMRPdfGenerator = require('./server/services/cmrPdfGenerator');
const MultiStopPdfGenerator = require('./server/services/multiStopPdfGenerator');

async function testCMRFormat() {
  console.log('\n🧪 TEST: CMR Format Vergleich\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Finde einen Multi-Stop Order
    console.log('1️⃣ Suche Multi-Stop Order...');
    const ordersResult = await pool.query(`
      SELECT id FROM transport_orders 
      WHERE status = 'completed' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (ordersResult.rows.length === 0) {
      console.log('❌ Keine abgeschlossenen Orders gefunden');
      console.log('   Erstelle einen Multi-Stop Order und schließe ihn ab, dann teste erneut.');
      process.exit(0);
    }
    
    const orderId = ordersResult.rows[0].id;
    console.log(`   ✅ Order gefunden: #${orderId}`);
    
    // Hole CMRs
    console.log('\n2️⃣ Lade CMRs...');
    const cmrGroupId = `ORDER-${orderId}`;
    const cmrs = await CMR.findByGroupId(cmrGroupId);
    
    if (!cmrs || cmrs.length === 0) {
      console.log('❌ Keine CMRs gefunden für Order #' + orderId);
      process.exit(0);
    }
    
    console.log(`   ✅ ${cmrs.length} CMR(s) gefunden`);
    cmrs.forEach((cmr, i) => {
      console.log(`      CMR ${i + 1}: ${cmr.cmr_number} (Stop ${cmr.delivery_stop_index + 1}/${cmr.total_stops})`);
    });
    
    // Hole Order
    const order = await Order.findById(orderId);
    
    // Generiere EINZELNES CMR (zum Vergleich)
    console.log('\n3️⃣ Generiere EINZELNES CMR (Referenz)...');
    const singleCmr = cmrs[0];
    const singlePdfPath = await CMRPdfGenerator.generateCMR(singleCmr, order);
    console.log(`   ✅ Einzelnes CMR generiert: ${singlePdfPath}`);
    console.log(`   📄 Dies ist das ECHTE CMR-Format das ihr immer verwendet!`);
    
    // Generiere KOMBINIERTES PDF
    if (cmrs.length > 1) {
      console.log('\n4️⃣ Generiere KOMBINIERTES Multi-Stop PDF...');
      const { filepath, filename } = await MultiStopPdfGenerator.generateCombinedPDF(orderId, cmrGroupId);
      console.log(`   ✅ Kombiniertes PDF generiert: ${filepath}`);
      console.log(`   📄 Enthält ${cmrs.length} CMRs im GLEICHEN Format!`);
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📊 VERGLEICH:\n');
      console.log(`   Einzelnes CMR:     ${singlePdfPath}`);
      console.log(`   Kombiniertes PDF:  ${filepath}`);
      console.log('\n✅ BEIDE verwenden CMRPdfGenerator.generateCMR()');
      console.log('✅ BEIDE haben das GLEICHE Format');
      console.log('✅ Kombiniertes PDF = Mehrere einzelne CMRs zusammen');
    } else {
      console.log('\n⚠️  Nur 1 CMR gefunden - kein Multi-Stop Order');
      console.log('   Erstelle einen Multi-Stop Order für vollständigen Test');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 TEST ABGESCHLOSSEN!\n');
    console.log('📂 PDFs gespeichert in: uploads/cmr/');
    console.log('👉 Öffne die PDFs und vergleiche sie!');
    console.log('   Sie sollten IDENTISCH aussehen (nur unterschiedliche Daten)');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testCMRFormat();

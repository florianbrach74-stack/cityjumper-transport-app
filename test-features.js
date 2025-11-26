const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

let adminToken = null;
let customerToken = null;
let testOrderId = null;

// Farben für Output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test1_CheckDatabaseMigration() {
  log('\n📊 Test 1: Datenbank-Migration prüfen', 'blue');
  log('='.repeat(50), 'blue');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'transport_orders' 
        AND column_name LIKE 'return_%'
      ORDER BY column_name;
    `);
    
    const expectedColumns = [
      'return_completed_at',
      'return_fee',
      'return_initiated_at',
      'return_initiated_by',
      'return_notes',
      'return_reason',
      'return_status'
    ];
    
    const foundColumns = result.rows.map(r => r.column_name);
    const allFound = expectedColumns.every(col => foundColumns.includes(col));
    
    if (allFound) {
      log('✅ Alle 7 Retouren-Spalten gefunden:', 'green');
      result.rows.forEach(row => {
        log(`   - ${row.column_name} (${row.data_type})`, 'green');
      });
      return true;
    } else {
      log('❌ Nicht alle Spalten gefunden!', 'red');
      log(`   Erwartet: ${expectedColumns.join(', ')}`, 'yellow');
      log(`   Gefunden: ${foundColumns.join(', ')}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Fehler: ${error.message}`, 'red');
    return false;
  }
}

async function test2_CheckCancelledOrdersInReports() {
  log('\n📊 Test 2: Stornierte Aufträge in Datenbank prüfen', 'blue');
  log('='.repeat(50), 'blue');
  
  try {
    // Prüfe ob es stornierte Aufträge gibt
    const result = await pool.query(`
      SELECT id, status, cancellation_status, cancellation_fee, cancelled_at
      FROM transport_orders
      WHERE cancellation_status IS NOT NULL
      LIMIT 5;
    `);
    
    if (result.rows.length > 0) {
      log(`✅ ${result.rows.length} stornierte Aufträge gefunden:`, 'green');
      result.rows.forEach(order => {
        log(`   - Auftrag #${order.id}: ${order.cancellation_status} (Gebühr: €${order.cancellation_fee || 0})`, 'green');
      });
      return true;
    } else {
      log('⚠️  Keine stornierten Aufträge in der Datenbank', 'yellow');
      log('   Das ist OK, wenn noch keine Stornierungen vorgenommen wurden.', 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Fehler: ${error.message}`, 'red');
    return false;
  }
}

async function test3_LoginAsAdmin() {
  log('\n🔐 Test 3: Als Admin einloggen', 'blue');
  log('='.repeat(50), 'blue');
  
  try {
    // Versuche mit verschiedenen Admin-Accounts
    const adminAccounts = [
      { email: 'admin@courierly.de', password: 'admin123' },
      { email: 'admin@test.com', password: 'admin123' },
    ];
    
    for (const account of adminAccounts) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, account);
        
        if (response.data.token && response.data.user.role === 'admin') {
          adminToken = response.data.token;
          log(`✅ Admin-Login erfolgreich: ${account.email}`, 'green');
          log(`   Token: ${adminToken.substring(0, 20)}...`, 'green');
          return true;
        }
      } catch (err) {
        // Versuche nächsten Account
        continue;
      }
    }
    
    log('❌ Kein Admin-Account gefunden', 'red');
    log('   Bitte erstelle einen Admin-Account oder passe die Credentials an.', 'yellow');
    return false;
  } catch (error) {
    log(`❌ Fehler: ${error.message}`, 'red');
    return false;
  }
}

async function test4_CheckReportsAPI() {
  log('\n📊 Test 4: Reports API mit Retourengebühren prüfen', 'blue');
  log('='.repeat(50), 'blue');
  
  if (!adminToken) {
    log('⚠️  Übersprungen - kein Admin-Token', 'yellow');
    return false;
  }
  
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.get(`${API_URL}/reports/summary`, {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const summary = response.data.summary;
    
    log('✅ Reports API funktioniert:', 'green');
    log(`   - Gesamt Aufträge: ${summary.totalOrders}`, 'green');
    log(`   - Abgeschlossene: ${summary.completedOrders}`, 'green');
    log(`   - Stornierte: ${summary.cancelledOrders}`, 'green');
    log(`   - Retouren: ${summary.returnOrders || 0}`, 'green');
    log(`   - Gesamt Umsatz: €${summary.totalRevenue.toFixed(2)}`, 'green');
    log(`   - Stornierungsgebühren: €${summary.totalCancellationFees.toFixed(2)}`, 'green');
    log(`   - Retourengebühren: €${summary.totalReturnFees ? summary.totalReturnFees.toFixed(2) : '0.00'}`, 'green');
    
    // Prüfe ob totalReturnFees existiert
    if (summary.hasOwnProperty('totalReturnFees')) {
      log('✅ totalReturnFees ist in der Summary enthalten', 'green');
      return true;
    } else {
      log('❌ totalReturnFees fehlt in der Summary!', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Fehler: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function test5_FindOrderForReturnTest() {
  log('\n🔍 Test 5: Auftrag für Retouren-Test finden', 'blue');
  log('='.repeat(50), 'blue');
  
  if (!adminToken) {
    log('⚠️  Übersprungen - kein Admin-Token', 'yellow');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Finde einen Auftrag mit Status 'delivered' oder 'in_transit' ohne Retoure
    const suitableOrder = response.data.orders.find(o => 
      (o.status === 'delivered' || o.status === 'in_transit' || o.status === 'completed') && 
      (!o.return_status || o.return_status === 'none')
    );
    
    if (suitableOrder) {
      testOrderId = suitableOrder.id;
      log(`✅ Geeigneter Auftrag gefunden: #${testOrderId}`, 'green');
      log(`   Status: ${suitableOrder.status}`, 'green');
      log(`   Route: ${suitableOrder.pickup_city} → ${suitableOrder.delivery_city}`, 'green');
      log(`   Preis: €${suitableOrder.customer_price || suitableOrder.price}`, 'green');
      return true;
    } else {
      log('⚠️  Kein geeigneter Auftrag für Retouren-Test gefunden', 'yellow');
      log('   Benötigt: Status "delivered" oder "in_transit" ohne bestehende Retoure', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Fehler: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function test6_InitiateReturn() {
  log('\n🔄 Test 6: Retoure starten (API-Test)', 'blue');
  log('='.repeat(50), 'blue');
  
  if (!adminToken || !testOrderId) {
    log('⚠️  Übersprungen - kein Admin-Token oder Test-Auftrag', 'yellow');
    return false;
  }
  
  try {
    // Hole Auftrags-Details
    const orderResponse = await axios.get(`${API_URL}/admin/orders/${testOrderId}/details`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const order = orderResponse.data.order;
    const maxReturnFee = parseFloat(order.customer_price || order.price);
    const testReturnFee = Math.min(50, maxReturnFee); // Max 50€ oder Auftragswert
    
    log(`   Auftrag #${testOrderId} - Max. Retourengebühr: €${maxReturnFee}`, 'blue');
    log(`   Test-Retourengebühr: €${testReturnFee}`, 'blue');
    
    // Starte Retoure
    const response = await axios.post(
      `${API_URL}/admin/orders/${testOrderId}/initiate-return`,
      {
        returnFee: testReturnFee,
        reason: 'Empfänger nicht angetroffen (TEST)',
        notes: 'Automatischer Test - kann ignoriert werden'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    if (response.data.success) {
      log('✅ Retoure erfolgreich gestartet!', 'green');
      log(`   Gebühr: €${testReturnFee}`, 'green');
      log(`   Grund: Empfänger nicht angetroffen (TEST)`, 'green');
      
      // Prüfe ob Daten in DB gespeichert wurden
      const dbCheck = await pool.query(
        'SELECT return_status, return_fee, return_reason FROM transport_orders WHERE id = $1',
        [testOrderId]
      );
      
      if (dbCheck.rows[0].return_status === 'pending' && 
          parseFloat(dbCheck.rows[0].return_fee) === testReturnFee) {
        log('✅ Daten korrekt in Datenbank gespeichert', 'green');
        return true;
      } else {
        log('❌ Daten nicht korrekt in Datenbank gespeichert', 'red');
        return false;
      }
    } else {
      log('❌ Retoure konnte nicht gestartet werden', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Fehler: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function test7_CheckReturnInReports() {
  log('\n📊 Test 7: Retoure in Reports prüfen', 'blue');
  log('='.repeat(50), 'blue');
  
  if (!adminToken || !testOrderId) {
    log('⚠️  Übersprungen - kein Admin-Token oder Test-Auftrag', 'yellow');
    return false;
  }
  
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.get(`${API_URL}/reports/summary`, {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const summary = response.data.summary;
    const orders = response.data.orders;
    
    // Finde unseren Test-Auftrag
    const testOrder = orders.find(o => o.id === testOrderId);
    
    if (testOrder && testOrder.return_fee && parseFloat(testOrder.return_fee) > 0) {
      log('✅ Test-Auftrag mit Retoure in Reports gefunden:', 'green');
      log(`   Auftrag #${testOrderId}`, 'green');
      log(`   Retourengebühr: €${testOrder.return_fee}`, 'green');
      log(`   Grund: ${testOrder.return_reason}`, 'green');
      
      if (summary.totalReturnFees > 0) {
        log(`✅ Retourengebühren in Summary: €${summary.totalReturnFees.toFixed(2)}`, 'green');
        return true;
      } else {
        log('⚠️  totalReturnFees ist 0, aber Retoure existiert', 'yellow');
        return false;
      }
    } else {
      log('⚠️  Test-Auftrag nicht in Reports gefunden oder keine Retourengebühr', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Fehler: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function test8_CleanupTestReturn() {
  log('\n🧹 Test 8: Test-Retoure aufräumen', 'blue');
  log('='.repeat(50), 'blue');
  
  if (!testOrderId) {
    log('⚠️  Übersprungen - kein Test-Auftrag', 'yellow');
    return true;
  }
  
  try {
    // Setze Retoure zurück
    await pool.query(`
      UPDATE transport_orders 
      SET return_status = 'none',
          return_fee = 0,
          return_reason = NULL,
          return_notes = NULL,
          return_initiated_at = NULL,
          return_initiated_by = NULL,
          return_completed_at = NULL
      WHERE id = $1
    `, [testOrderId]);
    
    log(`✅ Test-Retoure von Auftrag #${testOrderId} entfernt`, 'green');
    return true;
  } catch (error) {
    log(`❌ Fehler beim Aufräumen: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 FEATURE-TESTS: Stornierungen & Retouren', 'blue');
  log('='.repeat(60), 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  const tests = [
    { name: 'Datenbank-Migration', fn: test1_CheckDatabaseMigration },
    { name: 'Stornierte Aufträge', fn: test2_CheckCancelledOrdersInReports },
    { name: 'Admin-Login', fn: test3_LoginAsAdmin },
    { name: 'Reports API', fn: test4_CheckReportsAPI },
    { name: 'Auftrag finden', fn: test5_FindOrderForReturnTest },
    { name: 'Retoure starten', fn: test6_InitiateReturn },
    { name: 'Retoure in Reports', fn: test7_CheckReturnInReports },
    { name: 'Aufräumen', fn: test8_CleanupTestReturn }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result === true) {
        results.passed++;
      } else if (result === false) {
        results.failed++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      log(`\n❌ Test "${test.name}" abgebrochen: ${error.message}`, 'red');
      results.failed++;
    }
  }
  
  // Zusammenfassung
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST-ZUSAMMENFASSUNG', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Bestanden: ${results.passed}`, 'green');
  log(`❌ Fehlgeschlagen: ${results.failed}`, 'red');
  log(`⚠️  Übersprungen: ${results.skipped}`, 'yellow');
  log(`📈 Gesamt: ${tests.length}`, 'blue');
  
  const successRate = ((results.passed / tests.length) * 100).toFixed(1);
  log(`\n🎯 Erfolgsquote: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (results.failed === 0 && results.passed >= 6) {
    log('\n🎉 ALLE WICHTIGEN TESTS BESTANDEN!', 'green');
    log('✅ Features sind einsatzbereit!', 'green');
  } else if (results.failed > 0) {
    log('\n⚠️  EINIGE TESTS FEHLGESCHLAGEN', 'yellow');
    log('Bitte prüfe die Fehler oben.', 'yellow');
  }
  
  await pool.end();
  process.exit(results.failed > 0 ? 1 : 0);
}

// Tests ausführen
runAllTests().catch(error => {
  log(`\n❌ Kritischer Fehler: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkReturn() {
  try {
    const result = await pool.query(`
      SELECT id, status, return_status, return_fee, return_reason, return_notes,
             return_initiated_at, pickup_city, delivery_city
      FROM transport_orders
      WHERE id = 28
    `);
    
    if (result.rows.length > 0) {
      const order = result.rows[0];
      console.log('\n📦 Auftrag #28:');
      console.log('   Status:', order.status);
      console.log('   Route:', order.pickup_city, '→', order.delivery_city);
      console.log('\n🔄 Retouren-Info:');
      console.log('   return_status:', order.return_status);
      console.log('   return_fee:', order.return_fee);
      console.log('   return_reason:', order.return_reason);
      console.log('   return_notes:', order.return_notes);
      console.log('   return_initiated_at:', order.return_initiated_at);
      
      if (order.return_status === 'pending') {
        console.log('\n✅ Retoure wurde erfolgreich gestartet!');
      } else {
        console.log('\n⚠️  Retoure wurde NICHT gestartet oder Status ist falsch');
      }
    } else {
      console.log('❌ Auftrag #28 nicht gefunden');
    }
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkReturn();

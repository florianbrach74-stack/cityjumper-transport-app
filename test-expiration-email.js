const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testExpirationEmail() {
  try {
    console.log('🧪 Testing expiration email logic...\n');
    
    // 1. Create a test order that expires in 1 minute
    const now = new Date();
    const pickupDate = now.toISOString().split('T')[0]; // Today
    const pickupTimeFrom = new Date(now.getTime() - 65 * 60 * 1000); // 65 minutes ago
    const pickupTimeTo = new Date(now.getTime() - 60 * 60 * 1000); // 60 minutes ago
    
    const timeFrom = pickupTimeFrom.toTimeString().split(' ')[0];
    const timeTo = pickupTimeTo.toTimeString().split(' ')[0];
    
    console.log('📝 Creating test order:');
    console.log(`   Pickup date: ${pickupDate}`);
    console.log(`   Pickup time: ${timeFrom} - ${timeTo}`);
    console.log(`   Should be deleted: YES (expired 5 minutes ago)`);
    
    const createResult = await pool.query(`
      INSERT INTO transport_orders (
        customer_id, 
        pickup_address, pickup_city, pickup_postal_code, pickup_country,
        delivery_address, delivery_city, delivery_postal_code, delivery_country,
        pickup_date, pickup_time_from, pickup_time_to,
        vehicle_type, price, contractor_price, status,
        expired_and_archived, expiration_notification_sent_at
      ) VALUES (
        3, -- Your customer ID
        'Test Straße 1', 'Berlin', '12557', 'Deutschland',
        'Test Straße 2', 'Berlin', '12621', 'Deutschland',
        $1, $2, $3,
        'transporter', 50.00, 42.50, 'pending',
        FALSE, NULL
      ) RETURNING id
    `, [pickupDate, timeFrom, timeTo]);
    
    const testOrderId = createResult.rows[0].id;
    console.log(`\n✅ Test order created: #${testOrderId}`);
    
    // 2. Wait for OrderMonitoringService to run (it runs every 5 minutes)
    console.log('\n⏰ Waiting for OrderMonitoringService to detect expired order...');
    console.log('   (Service runs every 5 minutes, first check in 1 minute after server start)');
    console.log('\n📊 Check Railway logs for:');
    console.log('   ✅ "Email successfully sent to..."');
    console.log('   ✅ "Order #' + testOrderId + ' DELETED from database after successful email notification"');
    console.log('\n   OR if email fails:');
    console.log('   ❌ "CRITICAL: Email send failed for order #' + testOrderId + '"');
    console.log('   ❌ "Order #' + testOrderId + ' will NOT be deleted - will retry next check"');
    
    // 3. Check if order still exists after 2 minutes
    console.log('\n⏳ Checking order status in 2 minutes...');
    
    setTimeout(async () => {
      try {
        const checkResult = await pool.query(
          'SELECT * FROM transport_orders WHERE id = $1',
          [testOrderId]
        );
        
        if (checkResult.rows.length === 0) {
          console.log(`\n✅ SUCCESS: Order #${testOrderId} was deleted!`);
          console.log('   This means the email was sent successfully.');
        } else {
          console.log(`\n⚠️  Order #${testOrderId} still exists!`);
          console.log('   This means either:');
          console.log('   1. Email send failed (check logs)');
          console.log('   2. OrderMonitoringService hasn\'t run yet (wait 5 min)');
          console.log('   3. Order doesn\'t meet expiration criteria');
        }
        
        await pool.end();
      } catch (error) {
        console.error('Error checking order:', error.message);
        await pool.end();
      }
    }, 120000); // 2 minutes
    
    console.log('\n💡 TIP: Check Railway logs NOW to see the email send attempt!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

testExpirationEmail();

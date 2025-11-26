const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder36() {
  try {
    console.log('🔍 Checking Order #36...\n');
    
    // Check if order still exists
    const orderResult = await pool.query(
      'SELECT * FROM transport_orders WHERE id = 36'
    );
    
    if (orderResult.rows.length === 0) {
      console.log('✅ Order #36 was deleted (as expected)');
      console.log('\n🔍 Checking deletion timestamp in logs...');
      
      // Check when it was deleted by looking at similar orders
      const recentDeleted = await pool.query(`
        SELECT id, pickup_date, pickup_time_from, pickup_time_to, created_at
        FROM transport_orders
        WHERE status = 'pending' 
        AND contractor_id IS NULL
        AND pickup_date = '2025-11-26'
        ORDER BY id DESC
        LIMIT 5
      `);
      
      console.log('\n📊 Recent pending orders from same day:');
      recentDeleted.rows.forEach(order => {
        console.log(`Order #${order.id}: ${order.pickup_time_from} - ${order.pickup_time_to || 'open'}`);
      });
      
    } else {
      console.log('❌ Order #36 still exists!');
      const order = orderResult.rows[0];
      console.log('\nOrder details:');
      console.log(`  Status: ${order.status}`);
      console.log(`  Pickup: ${order.pickup_date} ${order.pickup_time_from} - ${order.pickup_time_to}`);
      console.log(`  Expired flag: ${order.expired_and_archived}`);
      console.log(`  Notification sent: ${order.expiration_notification_sent_at}`);
    }
    
    // Check Railway logs timestamp
    console.log('\n📝 ANALYSIS:');
    console.log('─'.repeat(80));
    console.log('Order #36 details from email:');
    console.log('  Pickup time: 12:30:00 - 12:33:00');
    console.log('  Deletion should happen at: 13:33:00 + 1h = 14:33:00');
    console.log('  Current time (Berlin): ~18:12:00');
    console.log('\n✅ Order should have been deleted at 14:33:00');
    console.log('❌ But expiration email was NOT sent!');
    console.log('\n💡 Possible causes:');
    console.log('  1. Email service failed (Resend API error)');
    console.log('  2. OrderMonitoringService was not running at 14:33');
    console.log('  3. Connection timeout during email send');
    console.log('  4. Order was deleted but email send failed silently');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrder36();

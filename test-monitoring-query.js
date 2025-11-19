const { Pool } = require('pg');

// Railway Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pIvtmqFhHMFdVSMwpjLQKFLOKLXNJPQE@junction.proxy.rlwy.net:52994/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testMonitoringQuery() {
  try {
    console.log('🔍 Testing Monitoring Query...\n');
    
    const now = new Date().toISOString();
    console.log(`Current time: ${now}\n`);
    
    // Test 1: Check orders with pickup window start
    console.log('📧 TEST 1: Orders where pickup window started...');
    const query1 = `
      SELECT 
        o.id,
        o.pickup_date,
        o.pickup_time_from,
        o.pickup_time_to,
        o.pickup_window_start_notified,
        o.status,
        (o.pickup_date + o.pickup_time_from) as pickup_start_timestamp,
        u.email as customer_email
      FROM transport_orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
      AND o.contractor_id IS NULL
      AND o.pickup_window_start_notified = FALSE
      AND o.pickup_date IS NOT NULL
      AND o.pickup_time_from IS NOT NULL
      AND (o.pickup_date + o.pickup_time_from) <= $1
    `;
    
    const result1 = await pool.query(query1, [now]);
    console.log(`Found ${result1.rows.length} orders:`);
    result1.rows.forEach(order => {
      console.log(`  - Order #${order.id}: ${order.pickup_date} ${order.pickup_time_from}-${order.pickup_time_to}`);
      console.log(`    Pickup start: ${order.pickup_start_timestamp}`);
      console.log(`    Customer: ${order.customer_email}`);
      console.log(`    Notified: ${order.pickup_window_start_notified}`);
    });
    
    console.log('\n🗄️ TEST 2: Orders that expired (1h after pickup end)...');
    const query2 = `
      SELECT 
        o.id,
        o.pickup_date,
        o.pickup_time_from,
        o.pickup_time_to,
        o.expired_and_archived,
        o.status,
        CASE 
          WHEN o.pickup_time_to IS NOT NULL THEN
            (o.pickup_date + o.pickup_time_to) + interval '1 hour'
          ELSE
            (o.pickup_date + o.pickup_time_from) + interval '1 hour'
        END as expiry_timestamp,
        u.email as customer_email
      FROM transport_orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
      AND o.contractor_id IS NULL
      AND o.expired_and_archived = FALSE
      AND o.pickup_date IS NOT NULL
      AND (
        CASE 
          WHEN o.pickup_time_to IS NOT NULL THEN
            (o.pickup_date + o.pickup_time_to) + interval '1 hour'
          ELSE
            (o.pickup_date + o.pickup_time_from) + interval '1 hour'
        END
      ) <= $1
    `;
    
    const result2 = await pool.query(query2, [now]);
    console.log(`Found ${result2.rows.length} expired orders:`);
    result2.rows.forEach(order => {
      console.log(`  - Order #${order.id}: ${order.pickup_date} ${order.pickup_time_from}-${order.pickup_time_to}`);
      console.log(`    Expiry: ${order.expiry_timestamp}`);
      console.log(`    Customer: ${order.customer_email}`);
      console.log(`    Archived: ${order.expired_and_archived}`);
    });
    
    console.log('\n✅ Query test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testMonitoringQuery();

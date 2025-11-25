const pool = require('./server/config/database');

async function checkUserOrders() {
  try {
    console.log('🔍 Checking orders for user ID 3...\n');
    
    // Check user info
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, company_name FROM users WHERE id = 3'
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User ID 3 not found!');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log('👤 User Info:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Company: ${user.company_name || 'N/A'}`);
    console.log(`   Role: ${user.role}\n`);
    
    // Check orders
    const ordersResult = await pool.query(
      `SELECT id, status, pickup_city, delivery_city, price, created_at, 
              invoice_number, payment_status
       FROM transport_orders 
       WHERE customer_id = 3 
       ORDER BY created_at DESC`
    );
    
    console.log(`📦 Total Orders: ${ordersResult.rows.length}\n`);
    
    if (ordersResult.rows.length === 0) {
      console.log('⚠️  No orders found for this user!');
    } else {
      console.log('Orders:');
      ordersResult.rows.forEach(order => {
        console.log(`   #${order.id} | ${order.status.padEnd(12)} | ${order.pickup_city} → ${order.delivery_city} | €${order.price} | ${new Date(order.created_at).toLocaleDateString('de-DE')}`);
        if (order.invoice_number) {
          console.log(`      Invoice: ${order.invoice_number} | Payment: ${order.payment_status || 'N/A'}`);
        }
      });
      
      // Count by status
      console.log('\n📊 Status Summary:');
      const statusCounts = {};
      ordersResult.rows.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
    
    // Test the API query that the frontend uses
    console.log('\n🔍 Testing API query (Order.getAll with customer_id filter)...\n');
    const apiResult = await pool.query(
      `SELECT o.*, 
        c.email as customer_email, c.first_name as customer_first_name, 
        c.last_name as customer_last_name, c.company_name as customer_company,
        ct.email as contractor_email, ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name, ct.company_name as contractor_company
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC`,
      [3]
    );
    
    console.log(`✅ API Query returned ${apiResult.rows.length} orders`);
    
    if (apiResult.rows.length > 0) {
      console.log('\nFirst order details:');
      const first = apiResult.rows[0];
      console.log(`   ID: ${first.id}`);
      console.log(`   Status: ${first.status}`);
      console.log(`   Customer: ${first.customer_first_name} ${first.customer_last_name} (${first.customer_email})`);
      console.log(`   Route: ${first.pickup_city} → ${first.delivery_city}`);
      console.log(`   Price: €${first.price}`);
      console.log(`   Created: ${first.created_at}`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserOrders();

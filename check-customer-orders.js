const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCustomerOrders() {
  try {
    const customerEmail = 'florianbrach74@gmail.com'; // From screenshot
    
    console.log('🔍 Checking orders for customer:', customerEmail);
    console.log('─'.repeat(80));
    
    // Find customer
    const customerResult = await pool.query(
      'SELECT id, email, role, first_name, last_name FROM users WHERE email = $1',
      [customerEmail]
    );
    
    if (customerResult.rows.length === 0) {
      console.log('❌ Customer not found');
      await pool.end();
      return;
    }
    
    const customer = customerResult.rows[0];
    console.log('\n✅ Customer found:');
    console.log(`   ID: ${customer.id}`);
    console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
    console.log(`   Role: ${customer.role}`);
    
    // Get all orders for this customer
    console.log('\n📦 Orders for this customer:');
    console.log('─'.repeat(80));
    
    const ordersResult = await pool.query(`
      SELECT id, status, pickup_city, delivery_city, price, 
             created_at, completed_at, cleaned_up, archived_at
      FROM transport_orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `, [customer.id]);
    
    if (ordersResult.rows.length === 0) {
      console.log('❌ NO ORDERS FOUND!');
      console.log('\n🔍 Checking if orders were cleaned up...');
      
      // Check for any orders that might have been deleted
      const allOrdersResult = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN cleaned_up = true THEN 1 END) as cleaned,
               COUNT(CASE WHEN archived_at IS NOT NULL THEN 1 END) as archived
        FROM transport_orders
      `);
      
      console.log('\n📊 Database statistics:');
      console.log(`   Total orders in DB: ${allOrdersResult.rows[0].total}`);
      console.log(`   Cleaned up orders: ${allOrdersResult.rows[0].cleaned}`);
      console.log(`   Archived orders: ${allOrdersResult.rows[0].archived}`);
    } else {
      console.log(`✅ Found ${ordersResult.rows.length} orders:\n`);
      
      ordersResult.rows.forEach((order, index) => {
        const cleanedFlag = order.cleaned_up ? '🗑️ CLEANED' : '';
        const archivedFlag = order.archived_at ? '📦 ARCHIVED' : '';
        console.log(`${index + 1}. Order #${order.id}`);
        console.log(`   Status: ${order.status} ${cleanedFlag} ${archivedFlag}`);
        console.log(`   Route: ${order.pickup_city} → ${order.delivery_city}`);
        console.log(`   Price: €${order.price}`);
        console.log(`   Created: ${order.created_at}`);
        if (order.completed_at) console.log(`   Completed: ${order.completed_at}`);
        console.log('');
      });
    }
    
    // Test the API query
    console.log('\n🔍 Testing API query (Order.getAll with customer filter)...');
    const apiResult = await pool.query(`
      SELECT o.*, 
        c.email as customer_email, c.first_name as customer_first_name, 
        c.last_name as customer_last_name, c.company_name as customer_company,
        ct.email as contractor_email, ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name, ct.company_name as contractor_company
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
    `, [customer.id]);
    
    console.log(`✅ API query returned ${apiResult.rows.length} orders`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkCustomerOrders();

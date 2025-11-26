const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testLoginIssue() {
  try {
    console.log('🔍 Checking email verification status...\n');
    
    // Check all users
    const usersResult = await pool.query(`
      SELECT id, email, role, email_verified, first_name, last_name
      FROM users
      ORDER BY role, email
    `);
    
    console.log('📊 All Users:');
    console.log('─'.repeat(80));
    usersResult.rows.forEach(user => {
      const verified = user.email_verified ? '✅' : '❌';
      console.log(`${verified} ${user.role.padEnd(12)} | ${user.email.padEnd(30)} | ${user.first_name} ${user.last_name}`);
    });
    
    console.log('\n🔍 Checking transport orders...\n');
    
    // Check orders
    const ordersResult = await pool.query(`
      SELECT id, customer_id, contractor_id, status, 
             pickup_city, delivery_city, price
      FROM transport_orders
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('📦 Recent Orders:');
    console.log('─'.repeat(80));
    ordersResult.rows.forEach(order => {
      console.log(`ID: ${order.id} | Status: ${order.status.padEnd(12)} | Customer: ${order.customer_id} | Contractor: ${order.contractor_id || 'none'}`);
      console.log(`   Route: ${order.pickup_city} → ${order.delivery_city} | Price: €${order.price}`);
    });
    
    console.log('\n📊 Summary:');
    console.log('─'.repeat(80));
    console.log(`Total users: ${usersResult.rows.length}`);
    console.log(`Verified users: ${usersResult.rows.filter(u => u.email_verified).length}`);
    console.log(`Unverified users: ${usersResult.rows.filter(u => !u.email_verified).length}`);
    console.log(`Total orders: ${ordersResult.rows.length}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLoginIssue();

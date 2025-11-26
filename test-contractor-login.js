const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testContractorLogin() {
  try {
    const email = 'florianbrach@gmx.de'; // Contractor from screenshot
    
    console.log('🔍 Testing login for:', email);
    console.log('─'.repeat(80));
    
    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      await pool.end();
      return;
    }
    
    const user = userResult.rows[0];
    console.log('\n✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Email verified: ${user.email_verified ? '✅ Yes' : '❌ No'}`);
    
    // Check if email_verified column exists
    console.log('\n🔍 Checking table structure...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_code', 'company_id')
      ORDER BY column_name
    `);
    
    console.log('\n📊 Relevant columns:');
    columnsResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Test the problematic query from orderController.js
    console.log('\n🔍 Testing contractor orders query...');
    try {
      const ordersResult = await pool.query(
        `SELECT o.* FROM transport_orders o
         LEFT JOIN users u ON o.contractor_id = u.id
         WHERE o.contractor_id = $1 OR (u.company_id = $1 AND u.role = 'employee')
         ORDER BY o.created_at DESC`,
        [user.id]
      );
      console.log(`✅ Query successful: ${ordersResult.rows.length} orders found`);
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
    }
    
    // Try simplified query
    console.log('\n🔍 Testing simplified query...');
    const simpleResult = await pool.query(
      `SELECT * FROM transport_orders WHERE contractor_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
    console.log(`✅ Simplified query: ${simpleResult.rows.length} orders found`);
    simpleResult.rows.forEach(order => {
      console.log(`   Order ${order.id}: ${order.status} | ${order.pickup_city} → ${order.delivery_city}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testContractorLogin();

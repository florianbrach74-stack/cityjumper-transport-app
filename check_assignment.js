// Check if order #15 is assigned to employee
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function checkAssignment() {
  try {
    console.log('🔍 Checking order #15 assignment...\n');
    
    // Check order
    const order = await pool.query(
      `SELECT id, status, contractor_id, assigned_employee_id, pickup_confirmed, delivery_confirmed
       FROM transport_orders 
       WHERE id = 15`
    );
    
    console.log('Order #15:', order.rows[0]);
    
    // Check employee
    const employee = await pool.query(
      `SELECT id, first_name, last_name, email, role, contractor_id
       FROM users 
       WHERE email = 'luci.flader@gmx.de'`
    );
    
    console.log('\nEmployee:', employee.rows[0]);
    
    // Check contractor
    if (order.rows[0]) {
      const contractor = await pool.query(
        `SELECT id, first_name, last_name, email, employee_assignment_mode
         FROM users 
         WHERE id = $1`,
        [order.rows[0].contractor_id]
      );
      
      console.log('\nContractor:', contractor.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAssignment();

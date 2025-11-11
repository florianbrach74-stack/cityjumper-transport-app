const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixEmployeeContractorIds() {
  try {
    console.log('🔧 Fixing employee contractor_id fields...');
    
    // Get all employees without contractor_id
    const employees = await pool.query(
      `SELECT id, email, first_name, last_name, contractor_id 
       FROM users 
       WHERE role = 'employee'`
    );
    
    console.log(`Found ${employees.rows.length} employees`);
    
    for (const employee of employees.rows) {
      console.log(`\n📋 Employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
      console.log(`   Current contractor_id: ${employee.contractor_id}`);
      
      if (!employee.contractor_id) {
        // Find orders assigned to this employee
        const orders = await pool.query(
          `SELECT DISTINCT contractor_id 
           FROM transport_orders 
           WHERE assigned_employee_id = $1 
           LIMIT 1`,
          [employee.id]
        );
        
        if (orders.rows.length > 0) {
          const contractorId = orders.rows[0].contractor_id;
          console.log(`   ✅ Found contractor from orders: ${contractorId}`);
          
          // Update employee with contractor_id
          await pool.query(
            `UPDATE users 
             SET contractor_id = $1 
             WHERE id = $2`,
            [contractorId, employee.id]
          );
          
          console.log(`   ✅ Updated employee ${employee.id} with contractor_id ${contractorId}`);
        } else {
          console.log(`   ⚠️  No orders found for this employee - cannot determine contractor`);
        }
      } else {
        console.log(`   ✅ Already has contractor_id`);
      }
    }
    
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmployeeContractorIds();

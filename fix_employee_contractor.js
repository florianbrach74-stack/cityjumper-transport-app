const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixEmployeeContractor() {
  try {
    console.log('🔍 Checking employees and contractors...\n');
    
    // Get all employees
    const employees = await pool.query(`
      SELECT id, first_name, last_name, email, contractor_id
      FROM users
      WHERE role = 'employee'
      ORDER BY created_at DESC
    `);
    
    console.log('📋 Employees:');
    employees.rows.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.email})`);
      console.log(`    ID: ${emp.id}, contractor_id: ${emp.contractor_id || 'NULL'}`);
    });
    
    console.log('\n📋 Contractors:');
    const contractors = await pool.query(`
      SELECT id, first_name, last_name, email, company_name
      FROM users
      WHERE role = 'contractor'
      ORDER BY created_at DESC
    `);
    
    contractors.rows.forEach(con => {
      console.log(`  - ${con.first_name} ${con.last_name} (${con.email})`);
      console.log(`    ID: ${con.id}, Company: ${con.company_name || 'N/A'}`);
    });
    
    // Find employees without contractor_id
    const orphanEmployees = employees.rows.filter(e => !e.contractor_id);
    
    if (orphanEmployees.length > 0 && contractors.rows.length > 0) {
      console.log('\n⚠️  Found employees without contractor_id!');
      console.log(`\nAssigning to first contractor (ID: ${contractors.rows[0].id})...\n`);
      
      for (const emp of orphanEmployees) {
        await pool.query(
          'UPDATE users SET contractor_id = $1 WHERE id = $2',
          [contractors.rows[0].id, emp.id]
        );
        console.log(`✅ Updated ${emp.first_name} ${emp.last_name} -> contractor_id: ${contractors.rows[0].id}`);
      }
      
      console.log('\n✅ All employees now have a contractor_id!');
    } else if (orphanEmployees.length === 0) {
      console.log('\n✅ All employees already have a contractor_id!');
    } else {
      console.log('\n⚠️  No contractors found to assign to!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixEmployeeContractor();

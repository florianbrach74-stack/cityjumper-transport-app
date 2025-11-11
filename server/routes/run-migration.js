const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Run migration endpoint - NO AUTH REQUIRED for emergency fixes
router.post('/run-migration/contractor-id', async (req, res) => {
  try {
    console.log('🔧 Running contractor_id migration...');
    
    // Add contractor_id column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES users(id);
    `);
    console.log('✅ contractor_id column added');
    
    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_contractor_id ON users(contractor_id);
    `);
    console.log('✅ Index created');
    
    // Get contractors
    const contractors = await pool.query(`
      SELECT id, first_name, last_name FROM users WHERE role = 'contractor' ORDER BY created_at ASC LIMIT 1
    `);
    
    if (contractors.rows.length === 0) {
      return res.json({ success: false, error: 'No contractors found' });
    }
    
    const contractorId = contractors.rows[0].id;
    console.log(`✅ Found contractor: ${contractors.rows[0].first_name} ${contractors.rows[0].last_name} (ID: ${contractorId})`);
    
    // Update all employees
    const result = await pool.query(`
      UPDATE users 
      SET contractor_id = $1 
      WHERE role = 'employee' AND contractor_id IS NULL
      RETURNING id, first_name, last_name
    `, [contractorId]);
    
    console.log(`✅ Updated ${result.rows.length} employees`);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      contractorId: contractorId,
      contractorName: `${contractors.rows[0].first_name} ${contractors.rows[0].last_name}`,
      updatedEmployees: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Migration may have already been applied'
    });
  }
});

// Fix employee role
router.post('/run-migration/fix-employee-role', async (req, res) => {
  try {
    console.log('🔧 Fixing employee role...');
    
    // Check current role
    const before = await pool.query(`
      SELECT id, first_name, last_name, email, role, contractor_id 
      FROM users 
      WHERE email = 'luci.flader@gmx.de'
    `);
    
    console.log('Before:', before.rows[0]);
    
    // Update role to employee
    const result = await pool.query(`
      UPDATE users 
      SET role = 'employee'
      WHERE email = 'luci.flader@gmx.de' AND role != 'employee'
      RETURNING id, first_name, last_name, email, role, contractor_id
    `);
    
    // Check after
    const after = await pool.query(`
      SELECT id, first_name, last_name, email, role, contractor_id 
      FROM users 
      WHERE email = 'luci.flader@gmx.de'
    `);
    
    console.log('After:', after.rows[0]);
    console.log('✅ Role fixed!');
    
    res.json({
      success: true,
      message: 'Employee role fixed',
      before: before.rows[0],
      after: after.rows[0],
      updated: result.rowCount > 0
    });
    
  } catch (error) {
    console.error('❌ Fix employee role error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Reset employee password
router.post('/run-migration/reset-employee-password', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const email = 'luci.flader@gmx.de';
    const newPassword = 'Test123!';
    
    console.log('🔐 Resetting password for:', email);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1 
       WHERE email = $2
       RETURNING id, first_name, last_name, email, role`,
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      res.json({ success: false, error: 'User not found' });
    } else {
      console.log('✅ Password reset successfully!');
      res.json({
        success: true,
        message: 'Password reset successfully',
        user: result.rows[0],
        email: email,
        newPassword: newPassword,
        warning: 'Please change this password after first login!'
      });
    }
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Check order assignment
// Fix employee contractor_id
router.post('/fix-employee-contractor-id', async (req, res) => {
  try {
    console.log('🔧 Fixing employee contractor_id fields...');
    
    // Get all employees
    const employees = await pool.query(
      `SELECT id, email, first_name, last_name, contractor_id 
       FROM users 
       WHERE role = 'employee'`
    );
    
    const results = [];
    
    for (const employee of employees.rows) {
      const result = {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        oldContractorId: employee.contractor_id
      };
      
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
          
          // Update employee with contractor_id
          await pool.query(
            `UPDATE users 
             SET contractor_id = $1 
             WHERE id = $2`,
            [contractorId, employee.id]
          );
          
          result.newContractorId = contractorId;
          result.status = 'fixed';
        } else {
          result.status = 'no_orders';
        }
      } else {
        result.status = 'already_set';
      }
      
      results.push(result);
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('❌ Fix error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/debug/check-assignment/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Check order
    const order = await pool.query(
      `SELECT id, status, contractor_id, assigned_employee_id, pickup_confirmed, delivery_confirmed
       FROM transport_orders 
       WHERE id = $1`,
      [orderId]
    );
    
    if (order.rows.length === 0) {
      return res.json({ error: 'Order not found' });
    }
    
    // Check employee
    const employee = await pool.query(
      `SELECT id, first_name, last_name, email, role, contractor_id
       FROM users 
       WHERE id = $1`,
      [order.rows[0].assigned_employee_id]
    );
    
    // Check contractor
    const contractor = await pool.query(
      `SELECT id, first_name, last_name, email, employee_assignment_mode
       FROM users 
       WHERE id = $1`,
      [order.rows[0].contractor_id]
    );
    
    res.json({
      order: order.rows[0],
      employee: employee.rows[0] || null,
      contractor: contractor.rows[0] || null
    });
    
  } catch (error) {
    console.error('❌ Check assignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

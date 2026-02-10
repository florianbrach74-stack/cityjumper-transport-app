const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

/**
 * Debug: Check contractor's assignment mode
 */
router.get('/check-assignment-mode/:contractorId', adminAuth, async (req, res) => {
  try {
    const { contractorId } = req.params;
    
    // Get contractor info
    const contractor = await pool.query(
      `SELECT id, email, company_name, role, employee_assignment_mode 
       FROM users 
       WHERE id = $1`,
      [contractorId]
    );
    
    if (contractor.rows.length === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    const c = contractor.rows[0];
    
    // Get all employees
    const employees = await pool.query(
      `SELECT id, email, first_name, last_name, contractor_id 
       FROM users 
       WHERE contractor_id = $1 AND role = 'employee'`,
      [contractorId]
    );
    
    // Get all orders for this contractor
    const orders = await pool.query(
      `SELECT id, status, assigned_employee_id, 
              pickup_address, delivery_address, created_at
       FROM transport_orders 
       WHERE contractor_id = $1
       ORDER BY created_at DESC`,
      [contractorId]
    );
    
    res.json({
      contractor: {
        id: c.id,
        email: c.email,
        company_name: c.company_name,
        role: c.role,
        employee_assignment_mode: c.employee_assignment_mode || 'NOT SET (defaults to all_access)'
      },
      employees: employees.rows.map(e => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        email: e.email,
        contractor_id: e.contractor_id
      })),
      orders: orders.rows.map(o => ({
        id: o.id,
        status: o.status,
        assigned_to_employee_id: o.assigned_employee_id,
        pickup: o.pickup_address,
        delivery: o.delivery_address,
        created_at: o.created_at
      })),
      summary: {
        assignment_mode: c.employee_assignment_mode || 'all_access (default)',
        total_employees: employees.rows.length,
        total_orders: orders.rows.length,
        assigned_orders: orders.rows.filter(o => o.assigned_employee_id).length,
        unassigned_orders: orders.rows.filter(o => !o.assigned_employee_id).length
      }
    });
  } catch (error) {
    console.error('Debug assignment mode error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

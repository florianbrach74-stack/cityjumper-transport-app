const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

/**
 * Test endpoint: Check if employee can see assigned orders
 */
router.get('/test-employee-orders/:employeeId', adminAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log(`🧪 Testing orders for employee ID: ${employeeId}`);
    
    // Get employee info
    const employee = await pool.query(
      `SELECT id, email, first_name, last_name, role, contractor_id 
       FROM users 
       WHERE id = $1`,
      [employeeId]
    );
    
    if (employee.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const emp = employee.rows[0];
    console.log(`   Employee: ${emp.first_name} ${emp.last_name} (${emp.email})`);
    console.log(`   Role: ${emp.role}`);
    console.log(`   Contractor ID: ${emp.contractor_id}`);
    
    if (!emp.contractor_id) {
      return res.json({
        employee: emp,
        error: 'Employee has no contractor_id - cannot see orders',
        solution: 'Run /api/fix-employees/fix-employees-contractor-id'
      });
    }
    
    // Get contractor's assignment mode
    const contractor = await pool.query(
      `SELECT id, email, company_name, employee_assignment_mode 
       FROM users 
       WHERE id = $1`,
      [emp.contractor_id]
    );
    
    const assignmentMode = contractor.rows[0]?.employee_assignment_mode || 'all_access';
    console.log(`   Contractor: ${contractor.rows[0]?.company_name}`);
    console.log(`   Assignment mode: ${assignmentMode}`);
    
    // Get all orders assigned to this employee
    const assignedOrders = await pool.query(
      `SELECT id, status, contractor_id, assigned_employee_id, 
              pickup_address, delivery_address, created_at
       FROM transport_orders 
       WHERE assigned_employee_id = $1
       ORDER BY created_at DESC`,
      [employeeId]
    );
    
    console.log(`   Orders assigned to employee: ${assignedOrders.rows.length}`);
    
    // Get orders that SHOULD be visible based on assignment mode
    let visibleOrders;
    if (assignmentMode === 'all_access') {
      visibleOrders = await pool.query(
        `SELECT id, status, contractor_id, assigned_employee_id,
                pickup_address, delivery_address, created_at
         FROM transport_orders
         WHERE contractor_id = $1 
           AND (
             (status = 'approved' AND assigned_employee_id IS NULL)
             OR (assigned_employee_id = $2 AND status NOT IN ('completed', 'cancelled'))
           )
         ORDER BY created_at DESC`,
        [emp.contractor_id, employeeId]
      );
    } else {
      visibleOrders = await pool.query(
        `SELECT id, status, contractor_id, assigned_employee_id,
                pickup_address, delivery_address, created_at
         FROM transport_orders
         WHERE contractor_id = $1 
           AND assigned_employee_id = $2
           AND status NOT IN ('completed', 'cancelled')
         ORDER BY created_at DESC`,
        [emp.contractor_id, employeeId]
      );
    }
    
    console.log(`   Orders that SHOULD be visible: ${visibleOrders.rows.length}`);
    
    res.json({
      employee: {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        role: emp.role,
        contractor_id: emp.contractor_id
      },
      contractor: {
        id: contractor.rows[0]?.id,
        name: contractor.rows[0]?.company_name,
        assignment_mode: assignmentMode
      },
      orders: {
        assigned: assignedOrders.rows.map(o => ({
          id: o.id,
          status: o.status,
          pickup: o.pickup_address,
          delivery: o.delivery_address,
          created_at: o.created_at
        })),
        visible: visibleOrders.rows.map(o => ({
          id: o.id,
          status: o.status,
          assigned_to_employee: o.assigned_employee_id === parseInt(employeeId),
          pickup: o.pickup_address,
          delivery: o.delivery_address,
          created_at: o.created_at
        }))
      },
      summary: {
        total_assigned: assignedOrders.rows.length,
        total_visible: visibleOrders.rows.length,
        can_see_order_107: visibleOrders.rows.some(o => o.id === 107)
      }
    });
  } catch (error) {
    console.error('Test employee orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');

// Get contractor's employee assignment settings
router.get('/settings', authenticateToken, authorizeRole('contractor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT employee_assignment_mode FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      assignmentMode: result.rows[0].employee_assignment_mode || 'all_access'
    });
  } catch (error) {
    console.error('Get assignment settings error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Einstellungen' });
  }
});

// Update contractor's employee assignment settings
router.put('/settings', authenticateToken, authorizeRole('contractor'), async (req, res) => {
  try {
    const { assignmentMode } = req.body;

    if (!['all_access', 'manual_assignment'].includes(assignmentMode)) {
      return res.status(400).json({ error: 'Ungültiger Zuweisungsmodus' });
    }

    await pool.query(
      'UPDATE users SET employee_assignment_mode = $1 WHERE id = $2',
      [assignmentMode, req.user.id]
    );

    res.json({
      message: 'Einstellungen aktualisiert',
      assignmentMode
    });
  } catch (error) {
    console.error('Update assignment settings error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Einstellungen' });
  }
});

// Test endpoint without auth
router.get('/employees-test', async (req, res) => {
  try {
    console.log('📋 TEST: Fetching all employees (no auth)');
    
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, contractor_id, role 
       FROM users 
       WHERE role = 'employee'
       ORDER BY first_name, last_name`
    );

    console.log(`   Found ${result.rows.length} employees`);
    res.json({ success: true, employees: result.rows });
  } catch (error) {
    console.error('Test employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contractor's employees
router.get('/employees', authenticateToken, authorizeRole('contractor'), async (req, res) => {
  try {
    console.log('📋 Fetching employees for contractor:', req.user.id);
    console.log('   User details:', { id: req.user.id, email: req.user.email, role: req.user.role });
    
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, contractor_id, role 
       FROM users 
       WHERE role = 'employee' AND contractor_id = $1
       ORDER BY first_name, last_name`,
      [req.user.id]
    );

    console.log(`   Found ${result.rows.length} employees`);
    if (result.rows.length > 0) {
      console.log('   Employees:', result.rows.map(e => `${e.first_name} ${e.last_name} (ID: ${e.id}, contractor_id: ${e.contractor_id}, role: ${e.role})`));
    } else {
      console.log('   ⚠️  No employees found! Checking all employees in database...');
      const allEmployees = await pool.query(
        `SELECT id, first_name, last_name, email, contractor_id, role 
         FROM users 
         WHERE role = 'employee'`
      );
      console.log('   All employees in DB:', allEmployees.rows);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Mitarbeiter' });
  }
});

// Assign order to employee
router.post('/orders/:orderId/assign', authenticateToken, authorizeRole('contractor'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { employeeId } = req.body;

    // Verify order belongs to this contractor
    const orderCheck = await pool.query(
      'SELECT contractor_id FROM transport_orders WHERE id = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }

    if (orderCheck.rows[0].contractor_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Auftrag' });
    }

    // Verify employee belongs to this contractor
    if (employeeId) {
      const employeeCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND contractor_id = $2 AND role = $3',
        [employeeId, req.user.id, 'employee']
      );

      if (employeeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
      }
    }

    // Assign order to employee (or unassign if employeeId is null)
    await pool.query(
      'UPDATE transport_orders SET assigned_employee_id = $1 WHERE id = $2',
      [employeeId || null, orderId]
    );

    // Get updated order with employee info
    const result = await pool.query(
      `SELECT o.*, 
              e.first_name as employee_first_name,
              e.last_name as employee_last_name,
              e.email as employee_email
       FROM transport_orders o
       LEFT JOIN users e ON o.assigned_employee_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    res.json({
      message: employeeId ? 'Auftrag zugewiesen' : 'Zuweisung entfernt',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({ error: 'Fehler beim Zuweisen des Auftrags' });
  }
});

// Get orders with assignment info (for contractor)
router.get('/orders', authenticateToken, authorizeRole('contractor'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
              e.first_name as employee_first_name,
              e.last_name as employee_last_name,
              e.email as employee_email
       FROM transport_orders o
       LEFT JOIN users e ON o.assigned_employee_id = e.id
       WHERE o.contractor_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders with assignments error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Aufträge' });
  }
});

// Get orders for employee (NEW LOGIC: all contractor orders + assignment info)
router.get('/employee/orders', authenticateToken, authorizeRole('employee'), async (req, res) => {
  try {
    console.log('📦 Fetching orders for employee:', req.user.id);
    
    // Get employee's contractor
    const employeeResult = await pool.query(
      'SELECT contractor_id FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (employeeResult.rows.length === 0 || !employeeResult.rows[0].contractor_id) {
      return res.json({ orders: [], assignmentMode: 'none', error: 'No contractor assigned' });
    }
    
    const contractorId = employeeResult.rows[0].contractor_id;
    console.log('   Contractor ID:', contractorId);
    
    // Get contractor's assignment mode
    const contractorResult = await pool.query(
      'SELECT employee_assignment_mode FROM users WHERE id = $1',
      [contractorId]
    );

    const assignmentMode = contractorResult.rows[0]?.employee_assignment_mode || 'all_access';
    console.log('   Assignment mode:', assignmentMode);

    // Get only approved orders (not yet picked up or completed)
    // In 'all_access' mode: show all approved orders
    // In 'manual_assignment' mode: show only orders assigned to this employee
    let query;
    let params;
    
    if (assignmentMode === 'all_access') {
      // Show: 
      // 1. All approved orders (not assigned yet) - can be taken
      // 2. All orders assigned to this employee (any status) - their own orders
      query = `
        SELECT o.*,
               e.first_name as employee_first_name,
               e.last_name as employee_last_name
        FROM transport_orders o
        LEFT JOIN users e ON o.assigned_employee_id = e.id
        WHERE o.contractor_id = $1 
          AND (
            (o.status = 'approved' AND o.assigned_employee_id IS NULL)
            OR o.assigned_employee_id = $2
          )
        ORDER BY o.created_at DESC
      `;
      params = [contractorId, req.user.id];
    } else {
      // Manual assignment: show only orders assigned to this employee (not completed)
      query = `
        SELECT o.*,
               e.first_name as employee_first_name,
               e.last_name as employee_last_name
        FROM transport_orders o
        LEFT JOIN users e ON o.assigned_employee_id = e.id
        WHERE o.contractor_id = $1 
          AND o.assigned_employee_id = $2
          AND o.status IN ('approved', 'accepted', 'picked_up', 'in_transit')
        ORDER BY o.created_at DESC
      `;
      params = [contractorId, req.user.id];
    }

    console.log('   Query params:', { contractorId, employeeId: req.user.id, assignmentMode });
    
    // DEBUG: Check if there are ANY orders assigned to this employee
    const debugCheck = await pool.query(
      `SELECT id, contractor_id, assigned_employee_id, status 
       FROM transport_orders 
       WHERE assigned_employee_id = $1`,
      [req.user.id]
    );
    console.log('   DEBUG: Orders assigned to employee:', debugCheck.rows);
    
    console.log('   Query:', query);
    
    const result = await pool.query(query, params);
    
    console.log(`   Found ${result.rows.length} orders for employee`);
    if (result.rows.length > 0) {
      console.log('   First order:', {
        id: result.rows[0].id,
        status: result.rows[0].status,
        assigned_employee_id: result.rows[0].assigned_employee_id,
        contractor_id: result.rows[0].contractor_id
      });
    }
    
    res.json({
      orders: result.rows,
      assignmentMode
    });
  } catch (error) {
    console.error('Get employee orders error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Aufträge' });
  }
});

// Employee takes/accepts an order
router.post('/employee/take-order/:orderId', authenticateToken, authorizeRole('employee'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log('📦 Employee', req.user.id, 'taking order', orderId);
    
    // Verify order belongs to employee's contractor
    const orderCheck = await pool.query(
      `SELECT o.id, o.contractor_id, u.contractor_id as employee_contractor_id
       FROM transport_orders o
       CROSS JOIN users u
       WHERE o.id = $1 AND u.id = $2`,
      [orderId, req.user.id]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    if (orderCheck.rows[0].contractor_id !== orderCheck.rows[0].employee_contractor_id) {
      return res.status(403).json({ error: 'Nicht autorisiert' });
    }
    
    // Assign order to employee
    const result = await pool.query(
      `UPDATE transport_orders 
       SET assigned_employee_id = $1
       WHERE id = $2
       RETURNING *`,
      [req.user.id, orderId]
    );
    
    console.log('✅ Order assigned to employee');
    
    res.json({
      success: true,
      message: 'Auftrag übernommen',
      order: result.rows[0]
    });
    
  } catch (error) {
    console.error('Take order error:', error);
    res.status(500).json({ error: 'Fehler beim Übernehmen des Auftrags' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');
const { sendOrderAssignmentNotification } = require('../utils/emailService');

// Get all orders (admin only)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        c.email as customer_email,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        ct.email as contractor_email,
        ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin only)
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE transport_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order details (admin only)
router.patch('/orders/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const allowedFields = [
      'pickup_address', 'pickup_city', 'pickup_postal_code', 'pickup_country',
      'pickup_date', 'pickup_time', 'pickup_contact_name', 'pickup_contact_phone',
      'delivery_address', 'delivery_city', 'delivery_postal_code', 'delivery_country',
      'delivery_date', 'delivery_time', 'delivery_contact_name', 'delivery_contact_phone',
      'vehicle_type', 'weight', 'length', 'width', 'height', 'pallets',
      'description', 'special_requirements', 'price', 'status'
    ];
    
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id);
    const query = `
      UPDATE transport_orders 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete order (admin only)
router.delete('/orders/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM transport_orders WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, email, role, company_name, first_name, last_name, phone, created_at,
        verification_status, verified_by, verified_at, verification_notes,
        insurance_document_url, business_license_url,
        minimum_wage_declaration_signed, minimum_wage_signed_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const validRoles = ['customer', 'contractor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role, first_name, last_name',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset contractor verification (admin only)
router.patch('/users/:id/reset-verification', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE users 
       SET verification_status = NULL,
           verified_by = NULL,
           verified_at = NULL,
           verification_notes = 'Verifizierung zurückgesetzt - erneute Prüfung erforderlich'
       WHERE id = $1 AND role = 'contractor'
       RETURNING id, email, company_name, first_name, last_name, verification_status`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    res.json({ 
      message: 'Verifizierung zurückgesetzt',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Reset verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset user password (admin only)
router.patch('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE users 
       SET password = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name`,
      [hashedPassword, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'Password reset successfully',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics (admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [ordersStats, usersStats] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_orders,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM transport_orders
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
          COUNT(CASE WHEN role = 'contractor' THEN 1 END) as contractors,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
        FROM users
      `)
    ]);
    
    res.json({
      orders: ordersStats.rows[0],
      users: usersStats.rows[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign order to contractor (admin only)
router.post('/orders/:id/assign', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractor_id } = req.body;
    
    if (!contractor_id) {
      return res.status(400).json({ error: 'Contractor ID required' });
    }
    
    // Update order with contractor assignment
    const result = await pool.query(
      `UPDATE transport_orders 
       SET contractor_id = $1, 
           assigned_by_admin = true, 
           details_visible_to_contractor = true,
           status = 'accepted',
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [contractor_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = result.rows[0];
    
    // Get contractor email
    const contractor = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [contractor_id]
    );
    
    if (contractor.rows.length > 0) {
      // Send notification with full details
      await sendOrderAssignmentNotification(contractor.rows[0].email, order);
    }
    
    res.json({ 
      message: 'Order assigned successfully',
      order: result.rows[0] 
    });
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get orders pending approval (with waiting time fees)
router.get('/orders/pending-approval', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        c.email as customer_email,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        ct.email as contractor_email,
        ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name,
        ct.company_name as contractor_company_name
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      WHERE o.status = 'pending_approval'
      ORDER BY o.updated_at DESC
    `);
    
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get pending approval orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve waiting time fee
router.post('/orders/:id/approve-waiting-time', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body; // true or false
    
    console.log(`⏱️ Admin ${approved ? 'approving' : 'rejecting'} waiting time for order #${id}`);
    
    if (approved) {
      // Approve and move to completed
      const result = await pool.query(
        `UPDATE transport_orders 
         SET status = 'completed',
             waiting_time_approved = true,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      console.log(`✅ Waiting time approved for order #${id}, fee: €${result.rows[0].waiting_time_fee}`);
      res.json({ 
        message: 'Waiting time approved',
        order: result.rows[0] 
      });
    } else {
      // Reject - set fee to 0 and move to completed
      const result = await pool.query(
        `UPDATE transport_orders 
         SET status = 'completed',
             waiting_time_approved = false,
             waiting_time_fee = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      console.log(`❌ Waiting time rejected for order #${id}`);
      res.json({ 
        message: 'Waiting time rejected',
        order: result.rows[0] 
      });
    }
  } catch (error) {
    console.error('Approve waiting time error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Suspend/Activate user account
router.patch('/users/:id/account-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { account_status } = req.body;
    
    const validStatuses = ['active', 'suspended', 'deleted'];
    if (!validStatuses.includes(account_status)) {
      return res.status(400).json({ error: 'Invalid account status' });
    }
    
    const result = await pool.query(
      'UPDATE users SET account_status = $1 WHERE id = $2 RETURNING *',
      [account_status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: `Account ${account_status === 'suspended' ? 'suspended' : 'activated'} successfully`,
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Update account status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed order information (for admin view)
router.get('/orders/:id/details', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        o.*,
        c.id as customer_id,
        c.email as customer_email,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        c.company_name as customer_company,
        c.company_address as customer_company_address,
        c.company_city as customer_company_city,
        c.company_postal_code as customer_company_postal_code,
        c.tax_id as customer_tax_id,
        c.vat_id as customer_vat_id,
        ct.id as contractor_id,
        ct.email as contractor_email,
        ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name,
        ct.phone as contractor_phone,
        ct.company_name as contractor_company,
        ct.company_address as contractor_company_address,
        ct.company_city as contractor_company_city,
        ct.company_postal_code as contractor_company_postal_code
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

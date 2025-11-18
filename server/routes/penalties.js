const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');

// Get all penalties (Admin only)
router.get('/penalties', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { status } = req.query; // Filter by status: pending, paid, waived, deducted
    
    let query = `
      SELECT 
        p.*,
        u.first_name, u.last_name, u.email, u.company_name,
        o.pickup_city, o.delivery_city, o.pickup_date
      FROM contractor_penalties p
      LEFT JOIN users u ON p.contractor_id = u.id
      LEFT JOIN transport_orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND p.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, values);
    
    // Calculate totals
    const totals = {
      pending: 0,
      paid: 0,
      waived: 0,
      deducted: 0,
      total: 0
    };
    
    result.rows.forEach(penalty => {
      const amount = parseFloat(penalty.penalty_amount) || 0;
      totals[penalty.status] += amount;
      totals.total += amount;
    });
    
    res.json({
      success: true,
      penalties: result.rows,
      totals
    });
    
  } catch (error) {
    console.error('Error fetching penalties:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get penalties for specific contractor
router.get('/penalties/contractor/:contractorId', authenticateToken, async (req, res) => {
  try {
    const { contractorId } = req.params;
    
    // Check authorization: contractor can only see their own, admin can see all
    if (req.user.role !== 'admin' && req.user.id !== parseInt(contractorId)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    const result = await pool.query(`
      SELECT 
        p.*,
        o.pickup_city, o.delivery_city, o.pickup_date, o.id as order_number
      FROM contractor_penalties p
      LEFT JOIN transport_orders o ON p.order_id = o.id
      WHERE p.contractor_id = $1
      ORDER BY p.created_at DESC
    `, [contractorId]);
    
    // Calculate total pending
    const pendingTotal = result.rows
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.penalty_amount || 0), 0);
    
    res.json({
      success: true,
      penalties: result.rows,
      pendingTotal
    });
    
  } catch (error) {
    console.error('Error fetching contractor penalties:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update penalty status (Admin only)
router.patch('/penalties/:penaltyId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { penaltyId } = req.params;
    const { status, notes } = req.body; // status: paid, waived, deducted
    
    if (!['paid', 'waived', 'deducted'].includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }
    
    const updateFields = ['status = $1', 'admin_notes = $2'];
    const values = [status, notes, penaltyId];
    
    if (status === 'paid' || status === 'waived' || status === 'deducted') {
      updateFields.push('paid_at = NOW()');
    }
    
    const result = await pool.query(`
      UPDATE contractor_penalties
      SET ${updateFields.join(', ')}
      WHERE id = $3
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strafe nicht gefunden' });
    }
    
    res.json({
      success: true,
      message: `Strafe als ${status} markiert`,
      penalty: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating penalty:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deduct penalty from contractor's next payout
router.post('/penalties/:penaltyId/deduct-from-order/:orderId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { penaltyId, orderId } = req.params;
    
    await client.query('BEGIN');
    
    // Get penalty
    const penaltyResult = await client.query(
      'SELECT * FROM contractor_penalties WHERE id = $1',
      [penaltyId]
    );
    
    if (penaltyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Strafe nicht gefunden' });
    }
    
    const penalty = penaltyResult.rows[0];
    
    if (penalty.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Strafe wurde bereits verarbeitet' });
    }
    
    // Get order
    const orderResult = await client.query(
      'SELECT * FROM transport_orders WHERE id = $1',
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    const order = orderResult.rows[0];
    
    // Check if contractor matches
    if (order.contractor_id !== penalty.contractor_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Auftragnehmer stimmt nicht überein' });
    }
    
    // Calculate new contractor price after deduction
    const originalContractorPrice = parseFloat(order.contractor_price) || 0;
    const penaltyAmount = parseFloat(penalty.penalty_amount) || 0;
    const newContractorPrice = Math.max(0, originalContractorPrice - penaltyAmount);
    
    // Update order
    await client.query(
      'UPDATE transport_orders SET contractor_price = $1 WHERE id = $2',
      [newContractorPrice, orderId]
    );
    
    // Update penalty
    await client.query(
      `UPDATE contractor_penalties 
       SET status = 'deducted', paid_at = NOW(), deducted_from_order_id = $1
       WHERE id = $2`,
      [orderId, penaltyId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Strafe von Auftrag abgezogen',
      originalPrice: originalContractorPrice,
      penaltyAmount,
      newPrice: newContractorPrice
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deducting penalty:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete penalty (Admin only - use with caution)
router.delete('/penalties/:penaltyId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { penaltyId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM contractor_penalties WHERE id = $1 RETURNING *',
      [penaltyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strafe nicht gefunden' });
    }
    
    res.json({
      success: true,
      message: 'Strafe gelöscht',
      penalty: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error deleting penalty:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

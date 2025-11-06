const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');

// Calculate cancellation fee based on AGB rules
function calculateCancellationFee(order, cancelledBy) {
  const pickupDateTime = new Date(`${order.pickup_date}T${order.pickup_time_from || '00:00'}`);
  const now = new Date();
  const hoursUntilPickup = (pickupDateTime - now) / (1000 * 60 * 60);
  
  let feePercentage = 0;
  let driverStatus = 'not_started';
  
  if (cancelledBy === 'customer') {
    // Customer cancellation rules from AGB
    if (hoursUntilPickup > 24) {
      feePercentage = 0; // Free cancellation
    } else if (hoursUntilPickup > 0) {
      feePercentage = 50; // 50% fee within 24 hours
      
      // Check if driver is already en route
      if (order.status === 'accepted' || order.status === 'in_transit') {
        feePercentage = 75; // 75% fee if driver started
        driverStatus = 'en_route';
      }
    } else {
      feePercentage = 75; // Past pickup time
      driverStatus = 'past_pickup';
    }
  }
  
  const originalPrice = parseFloat(order.price) || 0;
  const cancellationFee = (originalPrice * feePercentage) / 100;
  
  return {
    feePercentage,
    cancellationFee,
    hoursUntilPickup: Math.max(0, hoursUntilPickup),
    driverStatus,
    originalPrice
  };
}

// Cancel order by customer
router.post('/:orderId/cancel-by-customer', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    await client.query('BEGIN');
    
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
    
    // Verify customer owns this order
    if (order.customer_id !== userId && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    // Check if already cancelled
    if (order.cancellation_status) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Auftrag bereits storniert' });
    }
    
    // Calculate cancellation fee
    const feeInfo = calculateCancellationFee(order, 'customer');
    
    // Update order
    await client.query(
      `UPDATE transport_orders 
       SET cancellation_status = 'cancelled_by_customer',
           cancelled_by = 'customer',
           cancellation_reason = $1,
           cancellation_timestamp = NOW(),
           cancellation_fee = $2,
           cancellation_fee_percentage = $3,
           status = 'cancelled'
       WHERE id = $4`,
      [reason, feeInfo.cancellationFee, feeInfo.feePercentage, orderId]
    );
    
    // Create history entry
    await client.query(
      `INSERT INTO cancellation_history 
       (order_id, cancelled_by, cancellation_reason, cancellation_fee, 
        hours_before_pickup, driver_status, created_by)
       VALUES ($1, 'customer', $2, $3, $4, $5, $6)`,
      [orderId, reason, feeInfo.cancellationFee, feeInfo.hoursUntilPickup, 
       feeInfo.driverStatus, userId]
    );
    
    // If contractor was assigned, notify them (could add notification system here)
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Auftrag erfolgreich storniert',
      cancellationFee: feeInfo.cancellationFee,
      feePercentage: feeInfo.feePercentage,
      feeInfo
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order by customer:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Cancel order by contractor (Admin manages penalties)
router.post('/:orderId/cancel-by-contractor', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { orderId } = req.params;
    const { reason, contractorPenalty, customerCompensation, notes } = req.body;
    const userId = req.user.id;
    
    await client.query('BEGIN');
    
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
    
    // Check if already cancelled
    if (order.cancellation_status) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Auftrag bereits storniert' });
    }
    
    const penalty = parseFloat(contractorPenalty) || 0;
    const compensation = parseFloat(customerCompensation) || 0;
    
    // Update order
    await client.query(
      `UPDATE transport_orders 
       SET cancellation_status = 'cancelled_by_contractor',
           cancelled_by = 'contractor',
           cancellation_reason = $1,
           cancellation_timestamp = NOW(),
           contractor_penalty = $2,
           customer_compensation = $3,
           cancellation_notes = $4,
           status = 'cancelled'
       WHERE id = $5`,
      [reason, penalty, compensation, notes, orderId]
    );
    
    // Create history entry
    await client.query(
      `INSERT INTO cancellation_history 
       (order_id, cancelled_by, cancellation_reason, contractor_penalty, 
        customer_compensation, created_by)
       VALUES ($1, 'contractor', $2, $3, $4, $5)`,
      [orderId, reason, penalty, compensation, userId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Auftrag als Auftragnehmer-Stornierung markiert',
      contractorPenalty: penalty,
      customerCompensation: compensation
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order by contractor:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get cancellation preview (calculate fees without committing)
router.get('/:orderId/cancellation-preview', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderResult = await pool.query(
      'SELECT * FROM transport_orders WHERE id = $1',
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    const order = orderResult.rows[0];
    const feeInfo = calculateCancellationFee(order, 'customer');
    
    res.json({
      success: true,
      preview: {
        originalPrice: feeInfo.originalPrice,
        cancellationFee: feeInfo.cancellationFee,
        feePercentage: feeInfo.feePercentage,
        hoursUntilPickup: feeInfo.hoursUntilPickup,
        driverStatus: feeInfo.driverStatus,
        canCancelFree: feeInfo.feePercentage === 0
      }
    });
    
  } catch (error) {
    console.error('Error getting cancellation preview:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cancellation history for an order (Admin only)
router.get('/:orderId/history', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await pool.query(
      `SELECT ch.*, u.email as created_by_email 
       FROM cancellation_history ch
       LEFT JOIN users u ON ch.created_by = u.id
       WHERE ch.order_id = $1
       ORDER BY ch.created_at DESC`,
      [orderId]
    );
    
    res.json({
      success: true,
      history: result.rows
    });
    
  } catch (error) {
    console.error('Error getting cancellation history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Test route to update order #22 with new features
router.post('/test-update-order-22', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE transport_orders 
      SET 
        needs_loading_help = TRUE,
        needs_unloading_help = TRUE,
        loading_help_fee = 12.00,
        legal_delivery = TRUE
      WHERE id = 22
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order #22 not found' });
    }

    res.json({ 
      message: 'Order #22 updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

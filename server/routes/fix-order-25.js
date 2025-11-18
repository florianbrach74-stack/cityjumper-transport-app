const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Fix order #25 with correct values
router.post('/fix-order-25', async (req, res) => {
  try {
    console.log('🔧 Fixing order #25 with loading help and legal delivery...');
    
    const result = await pool.query(`
      UPDATE transport_orders 
      SET 
        needs_loading_help = TRUE,
        needs_unloading_help = TRUE,
        loading_help_fee = 12.00,
        legal_delivery = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 25
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order #25 not found' });
    }

    console.log('✅ Order #25 updated successfully');
    console.log('Values:', {
      needs_loading_help: result.rows[0].needs_loading_help,
      needs_unloading_help: result.rows[0].needs_unloading_help,
      loading_help_fee: result.rows[0].loading_help_fee,
      legal_delivery: result.rows[0].legal_delivery
    });

    res.json({ 
      success: true,
      message: 'Order #25 updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating order #25:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

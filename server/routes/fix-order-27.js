const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Fix order #27 with correct values
router.post('/fix-order-27', async (req, res) => {
  try {
    console.log('🔧 Fixing order #27 with legal_delivery...');
    
    // First check if order exists
    const checkResult = await pool.query(
      'SELECT id, legal_delivery, needs_loading_help, needs_unloading_help FROM transport_orders WHERE id = 27'
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Order #27 not found',
        message: 'Auftrag #27 existiert nicht in der Datenbank'
      });
    }
    
    console.log('Current values:', checkResult.rows[0]);
    
    // Update order #27
    const result = await pool.query(`
      UPDATE transport_orders 
      SET 
        legal_delivery = TRUE,
        needs_loading_help = FALSE,
        needs_unloading_help = TRUE,
        loading_help_fee = 6.00,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 27
      RETURNING *
    `);

    console.log('✅ Order #27 updated successfully');
    console.log('New values:', {
      legal_delivery: result.rows[0].legal_delivery,
      needs_loading_help: result.rows[0].needs_loading_help,
      needs_unloading_help: result.rows[0].needs_unloading_help,
      loading_help_fee: result.rows[0].loading_help_fee
    });

    res.json({ 
      success: true,
      message: 'Order #27 updated successfully',
      before: checkResult.rows[0],
      after: {
        id: result.rows[0].id,
        legal_delivery: result.rows[0].legal_delivery,
        needs_loading_help: result.rows[0].needs_loading_help,
        needs_unloading_help: result.rows[0].needs_unloading_help,
        loading_help_fee: result.rows[0].loading_help_fee
      }
    });
  } catch (error) {
    console.error('❌ Error updating order #27:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

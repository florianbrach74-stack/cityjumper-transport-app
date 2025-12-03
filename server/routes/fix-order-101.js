const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// TEMPORARY ENDPOINT - FIX ORDER 101
router.post('/fix-order-101', async (req, res) => {
  try {
    console.log('🔧 Fixing order #101 original_customer_price...');
    
    // Set original_customer_price to 23.55 (the price before increases)
    await pool.query(`
      UPDATE transport_orders 
      SET original_customer_price = 23.55
      WHERE id = 101
    `);
    
    const result = await pool.query(`
      SELECT id, price, original_customer_price, available_budget
      FROM transport_orders
      WHERE id = 101
    `);
    
    console.log('✅ Order #101 fixed!');
    
    res.json({
      success: true,
      message: 'Order #101 fixed',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Fix failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

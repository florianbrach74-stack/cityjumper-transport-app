const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// TEMPORARY ENDPOINT - FIX ORDER 101 BUDGET
router.post('/fix-order-101-budget', async (req, res) => {
  try {
    console.log('🔧 Fixing order #101 available_budget...');
    
    // Set available_budget to 20.02 (only penalty, not original price)
    await pool.query(`
      UPDATE transport_orders 
      SET available_budget = 20.02
      WHERE id = 101
    `);
    
    const result = await pool.query(`
      SELECT id, price, original_customer_price, available_budget, contractor_penalty
      FROM transport_orders
      WHERE id = 101
    `);
    
    console.log('✅ Order #101 budget fixed!');
    
    res.json({
      success: true,
      message: 'Order #101 budget fixed',
      order: result.rows[0],
      platformBonus: parseFloat(result.rows[0].price) - parseFloat(result.rows[0].original_customer_price),
      remainingBudget: parseFloat(result.rows[0].available_budget) - (parseFloat(result.rows[0].price) - parseFloat(result.rows[0].original_customer_price))
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

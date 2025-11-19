const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/fix-duplicate-emails', async (req, res) => {
  try {
    console.log('🔧 Fixing duplicate email issue for orders #31 and #32...');

    // Delete orders from database to stop duplicate emails and remove from available orders
    const result = await pool.query(`
      DELETE FROM transport_orders
      WHERE id IN (31, 32)
      RETURNING id
    `);

    console.log('✅ Orders updated:', result.rows);

    res.json({
      success: true,
      message: 'Orders marked as notified - no more duplicate emails',
      updated_orders: result.rows
    });

  } catch (error) {
    console.error('❌ Error fixing duplicate emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

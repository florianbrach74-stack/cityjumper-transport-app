const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// TEMPORARY ENDPOINT - DELETE AFTER MIGRATION
router.post('/run-original-price-migration', async (req, res) => {
  try {
    console.log('🔄 Running original_customer_price migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations', 'add_original_customer_price.sql'),
      'utf8'
    );
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed!');
    
    // Check results
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
        AND column_name = 'original_customer_price'
    `);
    
    const order101 = await pool.query(`
      SELECT id, price, original_customer_price, available_budget
      FROM transport_orders
      WHERE id = 101
    `);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      columnExists: checkResult.rows.length > 0,
      order101: order101.rows[0] || null
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/run-loading-help-migration', async (req, res) => {
  try {
    console.log('🔧 Running loading help and legal delivery migration...');
    
    // Add columns
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS needs_loading_help BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS needs_unloading_help BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS loading_help_fee DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS legal_delivery BOOLEAN DEFAULT FALSE;
    `);
    
    console.log('✅ Columns added successfully');
    
    // Verify columns exist
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('needs_loading_help', 'needs_unloading_help', 'loading_help_fee', 'legal_delivery')
      ORDER BY column_name
    `);
    
    console.log('✅ Verification:', result.rows);
    
    res.json({ 
      success: true,
      message: 'Migration completed successfully',
      columns: result.rows
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

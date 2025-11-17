const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

router.get('/run-invoice-tracking-migration', async (req, res) => {
  try {
    console.log('🔧 Running invoice tracking migration...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '021_add_invoice_tracking.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Invoice tracking migration completed!');
    res.json({ success: true, message: 'Invoice tracking migration completed' });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Setup database tables
router.post('/setup-database', async (req, res) => {
  try {
    console.log('🔧 Setting up database...');
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Main schema created');
    
    // Read and execute cmr_schema.sql
    const cmrSchemaPath = path.join(__dirname, '../database/cmr_schema.sql');
    const cmrSchema = fs.readFileSync(cmrSchemaPath, 'utf8');
    await pool.query(cmrSchema);
    console.log('✅ CMR schema created');
    
    res.json({ 
      success: true, 
      message: 'Database setup completed successfully!' 
    });
  } catch (error) {
    console.error('❌ Database setup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check database connection
router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      database: 'connected',
      time: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

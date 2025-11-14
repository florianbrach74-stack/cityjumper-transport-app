const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Fix verification_documents file_path column size (one-time use)
router.post('/fix-verification-documents-column', async (req, res) => {
  try {
    console.log('🚀 Fixing verification_documents file_path column size...');
    
    // Increase file_path column size from 500 to 2000 characters
    await pool.query(`
      ALTER TABLE verification_documents 
      ALTER COLUMN file_path TYPE VARCHAR(2000);
    `);
    
    console.log('✅ Column size increased to 2000 characters');
    
    res.json({
      success: true,
      message: 'file_path column size increased to 2000 characters'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

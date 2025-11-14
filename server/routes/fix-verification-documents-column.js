const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Fix verification_documents file_path column size (one-time use)
router.post('/fix-verification-documents-column', async (req, res) => {
  try {
    console.log('🚀 Fixing verification_documents file_path column size...');
    
    // Change file_path column to TEXT (unlimited length)
    await pool.query(`
      ALTER TABLE verification_documents 
      ALTER COLUMN file_path TYPE TEXT;
    `);
    
    console.log('✅ Column changed to TEXT (unlimited length)');
    
    res.json({
      success: true,
      message: 'file_path column changed to TEXT (unlimited length)'
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

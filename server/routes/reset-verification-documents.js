const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Reset and remigrate verification documents (one-time use)
router.post('/reset-verification-documents', async (req, res) => {
  try {
    console.log('🗑️ Deleting all verification documents...');
    
    // Delete all existing documents
    await pool.query('DELETE FROM verification_documents');
    
    console.log('✅ All documents deleted');
    
    res.json({
      success: true,
      message: 'All verification documents deleted. Run migration again.'
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

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Debug endpoint to see verification documents
router.get('/debug-verification-docs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM verification_documents WHERE user_id = $1 ORDER BY id',
      [userId]
    );
    
    res.json({
      userId,
      count: result.rows.length,
      documents: result.rows
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

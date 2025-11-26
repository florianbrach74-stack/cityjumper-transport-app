const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { cleanupOldOrdersManual } = require('../services/orderCleanupService');

// Manuelle Bereinigung (nur für Admin)
router.post('/run-cleanup', adminAuth, async (req, res) => {
  try {
    console.log('🔧 Admin hat manuelle Bereinigung gestartet');
    
    const result = await cleanupOldOrdersManual();
    
    res.json({
      success: true,
      message: 'Bereinigung erfolgreich durchgeführt',
      result: {
        deleted: result.deleted,
        kept: result.kept,
        cmrDeleted: result.cmrDeleted
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      error: 'Fehler bei der Bereinigung',
      details: error.message 
    });
  }
});

// Status der Bereinigung abrufen
router.get('/cleanup-status', adminAuth, async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Zähle bereinigte Aufträge
    const cleanedUp = await pool.query(
      'SELECT COUNT(*) as count FROM transport_orders WHERE cleaned_up = true'
    );
    
    // Zähle Aufträge die bereinigt werden könnten
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const canBeCleanedUp = await pool.query(`
      SELECT COUNT(*) as count 
      FROM transport_orders
      WHERE (status = 'completed' OR cancellation_status IS NOT NULL)
        AND COALESCE(completed_at, cancellation_timestamp) < $1
        AND COALESCE(completed_at, cancellation_timestamp) IS NOT NULL
        AND cleaned_up = false
    `, [threeMonthsAgo]);
    
    res.json({
      cleanedUp: parseInt(cleanedUp.rows[0].count),
      canBeCleanedUp: parseInt(canBeCleanedUp.rows[0].count),
      thresholdDate: threeMonthsAgo.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Cleanup status error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Status' });
  }
});

module.exports = router;

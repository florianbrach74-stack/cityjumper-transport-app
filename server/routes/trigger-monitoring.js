const express = require('express');
const router = express.Router();
const orderMonitoringService = require('../services/orderMonitoringService');

/**
 * Manual trigger for order monitoring (for testing)
 */
router.post('/trigger-monitoring', async (req, res) => {
  try {
    console.log('🔧 Manual monitoring trigger requested...');
    
    // Run monitoring check
    await orderMonitoringService.checkUnassignedOrders();
    
    res.json({
      success: true,
      message: 'Monitoring check completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error triggering monitoring:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

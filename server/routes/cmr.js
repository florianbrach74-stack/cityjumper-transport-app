const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  downloadCMRPdf
} = require('../controllers/cmrController');

// Get CMR by order ID
router.get('/order/:orderId', authenticateToken, getCMRByOrderId);

// Get CMR by CMR number (for public signature page)
router.get('/number/:cmrNumber', getCMRByCMRNumber);

// Add signature to CMR - NO AUTH required for consignee signature
router.post('/:cmrId/signature', optionalAuth, addSignature);

// Download CMR PDF - NO AUTH required
router.get('/:cmrNumber/download', downloadCMRPdf);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  downloadCMRPdf
} = require('../controllers/cmrController');

// Get CMR by order ID (requires auth)
router.get('/order/:orderId', authenticateToken, getCMRByOrderId);

// Get CMR by CMR number (PUBLIC - no auth required)
router.get('/number/:cmrNumber', getCMRByCMRNumber);

// Add signature to CMR (PUBLIC - no auth required for mobile signature)
router.post('/:cmrId/signature', addSignature);

// Download CMR PDF (PUBLIC - no auth required)
router.get('/:cmrNumber/download', downloadCMRPdf);

module.exports = router;

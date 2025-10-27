const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  addPublicSignature
} = require('../controllers/cmrController');

// Get CMR by order ID (requires auth)
router.get('/order/:orderId', authenticateToken, getCMRByOrderId);

// Get CMR by CMR number (PUBLIC - for signature page)
router.get('/number/:cmrNumber', getCMRByCMRNumber);

// Add signature to CMR (requires auth - for sender/carrier)
router.post('/:cmrId/signature', authenticateToken, addSignature);

// PUBLIC route for consignee signature (no auth required)
router.post('/public/:cmrNumber/signature', addPublicSignature);

module.exports = router;

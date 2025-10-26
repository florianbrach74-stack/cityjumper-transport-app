const express = require('express');
const router = express.Router();
const {
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  getMyCMRs,
} = require('../controllers/cmrController');
const { authenticateToken } = require('../middleware/auth');

// Get my CMRs (authenticated)
router.get('/my-cmrs', authenticateToken, getMyCMRs);

// Get CMR by order ID (authenticated)
router.get('/order/:orderId', authenticateToken, getCMRByOrderId);

// Get CMR by CMR number (public for signature page)
router.get('/:cmrNumber', getCMRByCMRNumber);

// Add signature (public for consignee, authenticated for sender/carrier)
router.post('/:cmrId/signature', addSignature);

module.exports = router;

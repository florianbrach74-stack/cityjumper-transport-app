const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  addPublicSignature,
  downloadCMRPdf,
  confirmPickup,
  confirmDelivery
} = require('../controllers/cmrController');

// Get CMR by order ID (requires auth)
router.get('/order/:orderId', authenticateToken, getCMRByOrderId);

// Get CMR by CMR number (PUBLIC - for signature page)
router.get('/number/:cmrNumber', getCMRByCMRNumber);

// Add signature to CMR (requires auth - for sender/carrier)
router.post('/:cmrId/signature', authenticateToken, addSignature);

// Confirm pickup with signatures (contractor only)
router.post('/order/:orderId/pickup', authenticateToken, confirmPickup);

// Confirm delivery with signature (contractor only)
router.post('/order/:orderId/delivery', authenticateToken, confirmDelivery);

// PUBLIC routes for signatures (no auth required)
router.post('/public/:cmrNumber/signature', addPublicSignature); // Consignee (legacy)
router.post('/public/:cmrNumber/sender', addPublicSignature); // Sender
router.post('/public/:cmrNumber/carrier', addPublicSignature); // Carrier
router.post('/public/:cmrNumber/consignee', addPublicSignature); // Consignee

// Download CMR PDF (PUBLIC - no auth required)
router.get('/:cmrNumber/download', downloadCMRPdf);

module.exports = router;

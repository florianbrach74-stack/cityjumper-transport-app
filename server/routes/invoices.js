const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createBulkInvoice,
  getAllInvoices,
  getInvoice,
  generateInvoicePDF,
  sendInvoiceEmail,
  updateInvoiceStatus,
  deleteInvoice
} = require('../controllers/invoiceController');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Create bulk invoice from multiple orders
router.post('/bulk', createBulkInvoice);

// Get all invoices
router.get('/', getAllInvoices);

// Get single invoice
router.get('/:invoiceId', getInvoice);

// Generate PDF
router.get('/:invoiceId/pdf', generateInvoicePDF);

// Send invoice via email
router.post('/:invoiceId/send', sendInvoiceEmail);

// Update invoice status
router.patch('/:invoiceId/status', updateInvoiceStatus);

// Delete invoice
router.delete('/:invoiceId', deleteInvoice);

module.exports = router;

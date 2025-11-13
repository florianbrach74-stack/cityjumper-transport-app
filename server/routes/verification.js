const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  submitVerification,
  approveContractor,
  rejectContractor,
  getVerificationStatus,
  getContractorDocuments,
  getAllContractorsWithDocuments,
  downloadDocument
} = require('../controllers/verificationController');

// Contractor routes
router.post('/submit', authenticateToken, authorizeRole('contractor'), submitVerification);
router.get('/status', authenticateToken, getVerificationStatus);

// Admin routes
router.post('/:userId/approve', authenticateToken, authorizeRole('admin'), approveContractor);
router.post('/:userId/reject', authenticateToken, authorizeRole('admin'), rejectContractor);
router.get('/contractors', authenticateToken, authorizeRole('admin'), getAllContractorsWithDocuments);
router.get('/contractors/:userId/documents', authenticateToken, authorizeRole('admin'), getContractorDocuments);
router.get('/documents/:documentId/download', authenticateToken, authorizeRole('admin'), downloadDocument);

module.exports = router;

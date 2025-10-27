const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  submitVerification,
  approveContractor,
  rejectContractor,
  getVerificationStatus
} = require('../controllers/verificationController');

// Contractor routes
router.post('/submit', authenticateToken, authorizeRole('contractor'), submitVerification);
router.get('/status', authenticateToken, getVerificationStatus);

// Admin routes
router.post('/:userId/approve', authenticateToken, authorizeRole('admin'), approveContractor);
router.post('/:userId/reject', authenticateToken, authorizeRole('admin'), rejectContractor);

module.exports = router;

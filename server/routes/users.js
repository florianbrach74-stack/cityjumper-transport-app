const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { updateProfile, updatePassword } = require('../controllers/userController');

// Update profile
router.put('/profile', authenticateToken, updateProfile);

// Update password
router.put('/password', authenticateToken, updatePassword);

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Update notification settings
router.put('/notification-settings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can update notification settings' });
    }

    const { notification_postal_codes } = req.body;

    if (!Array.isArray(notification_postal_codes)) {
      return res.status(400).json({ error: 'notification_postal_codes must be an array' });
    }

    // Validate postal codes
    for (const code of notification_postal_codes) {
      if (!/^\d{5}$/.test(code)) {
        return res.status(400).json({ error: `Invalid postal code: ${code}` });
      }
    }

    await pool.query(
      'UPDATE users SET notification_postal_codes = $1 WHERE id = $2',
      [notification_postal_codes, req.user.id]
    );

    res.json({ 
      message: 'Notification settings updated successfully',
      notification_postal_codes 
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

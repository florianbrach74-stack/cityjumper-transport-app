const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const databaseBackupService = require('../services/databaseBackupService');

/**
 * GET /api/backups
 * List all backups
 */
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const backups = await databaseBackupService.listBackups();

    res.json({
      success: true,
      backups,
      count: backups.length
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/backups/create
 * Create a new backup manually
 */
router.post('/create', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await databaseBackupService.createBackup();

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/backups/restore
 * Restore a backup (DANGEROUS!)
 */
router.post('/restore', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    const result = await databaseBackupService.restoreBackup(filename);

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restored successfully',
        filename: result.filename
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

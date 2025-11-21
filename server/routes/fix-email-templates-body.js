const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/fix-email-templates-body', async (req, res) => {
  try {
    console.log('🔧 Fixing email templates body field...');

    // Add body column if it doesn't exist
    await pool.query(`
      ALTER TABLE email_templates 
      ADD COLUMN IF NOT EXISTS body TEXT
    `);

    // Update body with html_content for existing templates
    await pool.query(`
      UPDATE email_templates 
      SET body = html_content 
      WHERE body IS NULL OR body = ''
    `);

    console.log('✅ Email templates body field fixed');

    // Get updated templates
    const result = await pool.query('SELECT id, name, subject, body FROM email_templates');

    res.json({
      success: true,
      message: 'Email templates body field fixed successfully',
      templates: result.rows
    });

  } catch (error) {
    console.error('❌ Error fixing email templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

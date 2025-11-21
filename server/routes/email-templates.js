const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * GET /api/email-templates
 * Get all email templates
 */
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM email_templates
      ORDER BY category, name
    `);

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/email-templates/:id
 * Get specific template
 */
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/email-templates/:id
 * Update email template
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, html_content, variables } = req.body;

    const result = await pool.query(
      `UPDATE email_templates
       SET subject = $1,
           html_content = $2,
           variables = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [subject, html_content, variables, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/email-templates/:id/reset
 * Reset template to default
 */
router.post('/:id/reset', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get template to find its key
    const templateResult = await pool.query(
      'SELECT template_key FROM email_templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const { template_key } = templateResult.rows[0];

    // Get default template
    const defaultTemplates = require('../config/defaultEmailTemplates');
    const defaultTemplate = defaultTemplates[template_key];

    if (!defaultTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Default template not found'
      });
    }

    // Reset to default
    const result = await pool.query(
      `UPDATE email_templates
       SET subject = $1,
           html_content = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [defaultTemplate.subject, defaultTemplate.html_content, id]
    );

    res.json({
      success: true,
      template: result.rows[0],
      message: 'Template reset to default'
    });
  } catch (error) {
    console.error('Error resetting template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/email-templates/test
 * Send test email
 */
router.post('/test', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { template_id, test_email, test_data } = req.body;

    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [template_id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const template = templateResult.rows[0];

    // Replace variables in template
    let subject = template.subject;
    let html = template.html_content;

    if (test_data) {
      Object.keys(test_data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, test_data[key]);
        html = html.replace(regex, test_data[key]);
      });
    }

    // Send test email
    const { sendEmail } = require('../config/email');
    await sendEmail(test_email, subject, html);

    res.json({
      success: true,
      message: `Test email sent to ${test_email}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

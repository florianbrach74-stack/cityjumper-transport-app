const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');
require('dotenv').config();

// Test email endpoint using Resend
router.get('/test-email', async (req, res) => {
  try {
    console.log('📧 Testing Resend email configuration...');
    console.log('   RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
    
    // Just try to send - sendEmail will handle missing key gracefully
    console.log('📤 Sending test email...');

    // Send test email
    const result = await sendEmail({
      to: 'info@courierly.de', // Send to your email
      subject: '✅ Courierly Railway Email Test - ' + new Date().toLocaleString('de-DE'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00d9ff;">✅ Railway Email-Test erfolgreich!</h1>
          
          <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;">
              <strong>🎉 Erfolg!</strong> Der Email-Service mit Resend funktioniert auf Railway!
            </p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Konfiguration:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>📧 <strong>Service:</strong> Resend API</li>
              <li>🌐 <strong>Domain:</strong> courierly.de</li>
              <li>📤 <strong>From:</strong> noreply@courierly.de</li>
              <li>✅ <strong>Status:</strong> Verified</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Gesendet am: ${new Date().toLocaleString('de-DE')}<br>
            Von: Courierly Backend (Railway + Resend)
          </p>
        </div>
      `
    });

    if (result.success) {
      console.log('✅ Test email sent successfully via Resend!');
      console.log('Message ID:', result.messageId);

      res.json({
        success: true,
        message: 'Email sent successfully via Resend!',
        messageId: result.messageId,
        service: 'Resend',
        domain: 'courierly.de',
        recipient: 'info@courierly.de'
      });
    } else {
      throw new Error(result.error || 'Failed to send email');
    }

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'Resend',
      resendConfigured: !!process.env.RESEND_API_KEY
    });
  }
});

module.exports = router;

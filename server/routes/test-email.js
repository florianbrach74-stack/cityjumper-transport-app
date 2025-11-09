const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Test email endpoint (only in development or for admin)
router.get('/test-email', async (req, res) => {
  try {
    console.log('📧 Testing email configuration...');
    
    // Show configuration (hide password)
    const config = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM,
      passwordSet: !!process.env.EMAIL_PASSWORD
    };
    
    console.log('Configuration:', config);

    // Check if all required variables are set
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'Email configuration incomplete',
        config,
        missing: {
          host: !process.env.EMAIL_HOST,
          user: !process.env.EMAIL_USER,
          password: !process.env.EMAIL_PASSWORD
        }
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Courierly Railway Email Test - ' + new Date().toLocaleString('de-DE'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00d9ff;">✅ Railway Email-Test erfolgreich!</h1>
          
          <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;">
              <strong>🎉 Erfolg!</strong> Der Email-Service funktioniert auf Railway!
            </p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Konfiguration:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>📧 <strong>SMTP Server:</strong> ${process.env.EMAIL_HOST}</li>
              <li>🔌 <strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li>🔒 <strong>Secure:</strong> ${process.env.EMAIL_SECURE === 'true' ? 'Ja (SSL/TLS)' : 'Nein (STARTTLS)'}</li>
              <li>👤 <strong>User:</strong> ${process.env.EMAIL_USER}</li>
              <li>📤 <strong>From:</strong> ${process.env.EMAIL_FROM}</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Gesendet am: ${new Date().toLocaleString('de-DE')}<br>
            Von: Courierly Backend (Railway)
          </p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);

    res.json({
      success: true,
      message: 'Email sent successfully!',
      messageId: info.messageId,
      config,
      recipient: process.env.EMAIL_USER
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER,
        passwordSet: !!process.env.EMAIL_PASSWORD
      }
    });
  }
});

module.exports = router;

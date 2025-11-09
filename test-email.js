const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('🔧 Testing Email Configuration...\n');
  
  // Show configuration
  console.log('Configuration:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('  EMAIL_USER:', process.env.EMAIL_USER);
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true // Log to console
  });

  try {
    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Courierly Email Test - ' + new Date().toLocaleString('de-DE'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00d9ff;">✅ Email-Test erfolgreich!</h1>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #00d9ff; padding: 15px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #0284c7;">Courierly Email-Service</h2>
            <p>Dieser Test wurde erfolgreich von Ihrem Courierly-Backend gesendet.</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Konfiguration:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>📧 <strong>SMTP Server:</strong> ${process.env.EMAIL_HOST}</li>
              <li>🔌 <strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li>🔒 <strong>Secure:</strong> ${process.env.EMAIL_SECURE === 'true' ? 'Ja (SSL/TLS)' : 'Nein'}</li>
              <li>👤 <strong>User:</strong> ${process.env.EMAIL_USER}</li>
              <li>📤 <strong>From:</strong> ${process.env.EMAIL_FROM}</li>
            </ul>
          </div>

          <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;">
              <strong>✅ Status:</strong> Email-Service funktioniert einwandfrei!
            </p>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Gesendet am: ${new Date().toLocaleString('de-DE')}<br>
            Von: Courierly Backend
          </p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n🎉 Email test completed successfully!');
    console.log('📬 Check your inbox at:', process.env.EMAIL_USER);

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Timeout Error - Possible causes:');
      console.error('   - Firewall blocking port', process.env.EMAIL_PORT);
      console.error('   - Wrong SMTP server:', process.env.EMAIL_HOST);
      console.error('   - Network connectivity issues');
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication Error - Possible causes:');
      console.error('   - Wrong email or password');
      console.error('   - SMTP access not enabled in email account');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Refused - Possible causes:');
      console.error('   - Wrong port number');
      console.error('   - SMTP server not accepting connections');
    }
  }
}

testEmail();

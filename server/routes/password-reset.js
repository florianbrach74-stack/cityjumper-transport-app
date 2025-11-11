const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const { sendEmail } = require('../config/email');

// Request password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email ist erforderlich' });
    }

    console.log('🔐 Password reset requested for:', email);

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      console.log('⚠️  User not found, but returning success');
      return res.json({ 
        success: true, 
        message: 'Wenn diese Email-Adresse registriert ist, erhalten Sie eine Email mit Anweisungen zum Zurücksetzen Ihres Passworts.' 
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    // Send reset email
    const resetUrl = `https://cityjumper-transport-app.vercel.app/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    await sendEmail(
      email,
      'Passwort zurücksetzen - Courierly',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Passwort zurücksetzen</h2>
          <p>Hallo ${user.first_name} ${user.last_name},</p>
          <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Passwort zurücksetzen
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Oder kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚠️ Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese Email einfach.<br>
            Ihr Passwort bleibt unverändert.
          </p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Mit freundlichen Grüßen,<br>
            Ihr Courierly Team
          </p>
        </div>
      `
    );

    console.log('✅ Password reset email sent to:', email);

    res.json({ 
      success: true, 
      message: 'Wenn diese Email-Adresse registriert ist, erhalten Sie eine Email mit Anweisungen zum Zurücksetzen Ihres Passworts.' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Fehler beim Senden der Reset-Email' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    console.log('🔐 Password reset attempt for:', email);

    // Hash the token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email 
       FROM users 
       WHERE email = $1 
       AND reset_token = $2 
       AND reset_token_expiry > NOW()`,
      [email.toLowerCase(), resetTokenHash]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Invalid or expired reset token');
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Reset-Link' });
    }

    const user = userResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log('✅ Password reset successful for:', email);

    // Send confirmation email
    await sendEmail(
      email,
      'Passwort erfolgreich geändert - Courierly',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Passwort erfolgreich geändert</h2>
          <p>Hallo ${user.first_name} ${user.last_name},</p>
          <p>Ihr Passwort wurde erfolgreich geändert.</p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <p style="margin: 0;">Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cityjumper-transport-app.vercel.app/login" 
               style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Zur Anmeldung
            </a>
          </div>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚠️ Wichtig:</strong> Wenn Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie uns sofort!
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Mit freundlichen Grüßen,<br>
            Ihr Courierly Team
          </p>
        </div>
      `
    );

    res.json({ 
      success: true, 
      message: 'Passwort erfolgreich geändert. Sie können sich jetzt anmelden.' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
  }
});

module.exports = router;

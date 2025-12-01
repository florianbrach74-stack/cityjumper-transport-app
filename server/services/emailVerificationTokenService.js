const crypto = require('crypto');
const pool = require('../config/database');
const { sendEmail } = require('../config/email');

/**
 * Generiere sicheren Verifizierungs-Token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sende Verifizierungs-Email mit Link
 */
async function sendVerificationEmailWithLink(userId, email, firstName) {
  try {
    console.log('📧 [Verification] Starting email verification process...');
    console.log('   User ID:', userId);
    console.log('   Email:', email);
    console.log('   First Name:', firstName);
    
    // Generiere Token
    const token = generateVerificationToken();
    console.log('   Token generated:', token.substring(0, 10) + '...');
    
    // Speichere Token in Datenbank (gültig für 2 Stunden)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Stunden
    console.log('   Expires at:', expiresAt);
    
    console.log('   Updating database...');
    await pool.query(
      `UPDATE users 
       SET email_verification_token = $1,
           email_verification_expires_at = $2
       WHERE id = $3`,
      [token, expiresAt, userId]
    );
    console.log('   ✅ Database updated successfully');
    
    // Erstelle Verifizierungs-Link
    const verificationLink = `https://courierly.de/verify-email/${token}`;
    
    // Sende Email
    const subject = '✅ Email-Verifizierung - Courierly';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .button:hover { background: #5568d3; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Willkommen bei Courierly!</h1>
          </div>
          <div class="content">
            <p>Hallo ${firstName},</p>
            <p>vielen Dank für Ihre Registrierung bei Courierly!</p>
            <p>Um Ihre Email-Adresse zu verifizieren, klicken Sie bitte auf den folgenden Button:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">
                ✅ Email jetzt verifizieren
              </a>
            </div>
            
            <div class="info">
              <strong>⏰ Gültigkeitsdauer:</strong> Dieser Link ist 2 Stunden gültig.
            </div>
            
            <div class="warning">
              <strong>🔒 Sicherheitshinweise:</strong>
              <ul style="margin: 10px 0;">
                <li>Geben Sie diesen Link niemals an Dritte weiter</li>
                <li>Courierly wird Sie niemals nach diesem Link fragen</li>
                <li>Falls Sie sich nicht registriert haben, ignorieren Sie diese Email</li>
              </ul>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              Falls der Button nicht funktioniert, kopieren Sie bitte folgenden Link in Ihren Browser:<br>
              <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
            </p>
            
            <p style="margin-top: 30px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <p>Viele Grüße,<br>Ihr Courierly-Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Courierly - Ihr Transport-Partner</p>
            <p>Diese Email wurde automatisch generiert. Bitte antworten Sie nicht auf diese Email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    console.log('   Sending email...');
    console.log('   To:', email);
    console.log('   Subject:', subject);
    console.log('   Link:', verificationLink);
    
    await sendEmail(email, subject, html);
    
    console.log(`✅ Verifizierungs-Email mit Link gesendet an ${email}`);
    return { success: true, token };
  } catch (error) {
    console.error('❌❌❌ FEHLER beim Senden der Verifizierungs-Email:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error detail:', error.detail);
    console.error('   Error hint:', error.hint);
    console.error('   Full error:', error);
    throw error;
  }
}

/**
 * Verifiziere Email mit Token
 */
async function verifyEmailWithToken(token) {
  try {
    const result = await pool.query(
      `SELECT id, email, email_verification_token, email_verification_expires_at, email_verified
       FROM users
       WHERE email_verification_token = $1`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Ungültiger Verifizierungs-Link' };
    }
    
    const user = result.rows[0];
    
    // Bereits verifiziert?
    if (user.email_verified) {
      return { success: false, error: 'Email bereits verifiziert', alreadyVerified: true };
    }
    
    // Token abgelaufen?
    if (new Date() > new Date(user.email_verification_expires_at)) {
      return { success: false, error: 'Verifizierungs-Link abgelaufen. Bitte fordern Sie einen neuen an.', expired: true };
    }
    
    // Verifizierung erfolgreich
    await pool.query(
      `UPDATE users 
       SET email_verified = true,
           email_verified_at = NOW(),
           email_verification_token = NULL,
           email_verification_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );
    
    console.log(`✅ Email verifiziert für Benutzer #${user.id} (${user.email})`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('❌ Fehler bei Email-Verifizierung:', error);
    throw error;
  }
}

/**
 * Lösche abgelaufene unverifizierte Accounts (älter als 2 Stunden)
 */
async function cleanupExpiredUnverifiedAccounts() {
  try {
    const result = await pool.query(
      `DELETE FROM users 
       WHERE email_verified = false 
       AND created_at < NOW() - INTERVAL '2 hours'
       RETURNING email`
    );
    
    if (result.rows.length > 0) {
      console.log(`🧹 ${result.rows.length} abgelaufene unverifizierte Accounts gelöscht:`);
      result.rows.forEach(row => console.log(`   - ${row.email}`));
    }
    
    return { success: true, deleted: result.rows.length };
  } catch (error) {
    console.error('❌ Fehler beim Cleanup:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmailWithLink,
  verifyEmailWithToken,
  cleanupExpiredUnverifiedAccounts,
  generateVerificationToken
};

const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');

/**
 * Generiere 6-stelligen Verifizierungs-Code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sende Verifizierungs-Email
 */
async function sendVerificationEmail(userId, email, firstName) {
  try {
    // Generiere Code
    const code = generateVerificationCode();
    
    // Speichere Code in Datenbank (gültig für 15 Minuten)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query(
      `UPDATE users 
       SET email_verification_code = $1,
           email_verification_expires_at = $2
       WHERE id = $3`,
      [code, expiresAt, userId]
    );
    
    // Sende Email
    const subject = 'Email-Verifizierung - Courierly';
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
          .code-box { background: white; border: 3px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
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
            <p>Um Ihre Email-Adresse zu verifizieren, geben Sie bitte folgenden Code ein:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              <strong>⏰ Wichtig:</strong> Dieser Code ist nur 15 Minuten gültig.
            </div>
            
            <p><strong>Sicherheitshinweise:</strong></p>
            <ul>
              <li>Geben Sie diesen Code niemals an Dritte weiter</li>
              <li>Courierly wird Sie niemals nach diesem Code fragen</li>
              <li>Falls Sie sich nicht registriert haben, ignorieren Sie diese Email</li>
            </ul>
            
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
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
    
    await sendEmail(email, subject, html);
    
    console.log(`✅ Verifizierungs-Email gesendet an ${email} (Code: ${code})`);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Verifizierungs-Email:', error);
    throw error;
  }
}

/**
 * Verifiziere Email mit Code
 */
async function verifyEmailCode(email, code) {
  try {
    const result = await pool.query(
      `SELECT id, email_verification_code, email_verification_expires_at, email_verified
       FROM users
       WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }
    
    const user = result.rows[0];
    
    // Bereits verifiziert?
    if (user.email_verified) {
      return { success: false, error: 'Email bereits verifiziert' };
    }
    
    // Code falsch?
    if (user.email_verification_code !== code) {
      return { success: false, error: 'Ungültiger Verifizierungs-Code' };
    }
    
    // Code abgelaufen?
    if (new Date() > new Date(user.email_verification_expires_at)) {
      return { success: false, error: 'Verifizierungs-Code abgelaufen. Bitte fordern Sie einen neuen an.' };
    }
    
    // Verifizierung erfolgreich
    await pool.query(
      `UPDATE users 
       SET email_verified = true,
           email_verified_at = NOW(),
           email_verification_code = NULL,
           email_verification_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );
    
    console.log(`✅ Email verifiziert für Benutzer #${user.id}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler bei Email-Verifizierung:', error);
    throw error;
  }
}

/**
 * Neuen Verifizierungs-Code anfordern
 */
async function resendVerificationCode(email) {
  try {
    const result = await pool.query(
      'SELECT id, first_name, email_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }
    
    const user = result.rows[0];
    
    if (user.email_verified) {
      return { success: false, error: 'Email bereits verifiziert' };
    }
    
    await sendVerificationEmail(user.id, email, user.first_name);
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler beim erneuten Senden:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  verifyEmailCode,
  resendVerificationCode
};

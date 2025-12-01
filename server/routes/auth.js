const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { verifyEmailCode, resendVerificationCode } = require('../services/emailVerificationService');
const { verifyEmailWithToken } = require('../services/emailVerificationTokenService');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Email verification routes
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email und Code sind erforderlich' });
    }
    
    const result = await verifyEmailCode(email, code);
    
    if (result.success) {
      res.json({ success: true, message: 'Email erfolgreich verifiziert!' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Fehler bei der Verifizierung' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email ist erforderlich' });
    }
    
    const result = await resendVerificationCode(email);
    
    if (result.success) {
      res.json({ success: true, message: 'Neuer Code wurde gesendet!' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Fehler beim Senden des Codes' });
  }
});

// Token-based email verification (Link in Email)
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token ist erforderlich' });
    }
    
    const result = await verifyEmailWithToken(token);
    
    if (result.success) {
      // Redirect to login with success message
      res.redirect('/login?verified=true');
    } else if (result.alreadyVerified) {
      res.redirect('/login?already_verified=true');
    } else if (result.expired) {
      res.redirect('/login?expired=true');
    } else {
      res.redirect('/login?error=invalid_token');
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.redirect('/login?error=server_error');
  }
});

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router;

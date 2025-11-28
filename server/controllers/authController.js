const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');
const { sendVerificationEmail } = require('../services/emailVerificationService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, password, role, company_name, first_name, last_name, phone,
      company_address, company_postal_code, company_city, company_country,
      tax_id, vat_id
    } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ error: 'Telefonnummer ist erforderlich' });
    }

    if (!company_address || !company_postal_code || !company_city) {
      return res.status(400).json({ 
        error: 'Rechnungsadresse ist erforderlich',
        details: ['Straße, PLZ und Stadt müssen angegeben werden']
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Passwort ist nicht sicher genug',
        details: passwordValidation.errors 
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      role,
      company_name,
      first_name,
      last_name,
      phone,
      company_address,
      company_postal_code,
      company_city,
      company_country: company_country || 'Deutschland',
      tax_id,
      vat_id,
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.id, user.email, user.first_name);
      console.log('✅ Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Continue anyway - user can request new code
    }

    // Return success without token - user must verify email first
    res.status(201).json({
      message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihre Emails.',
      requiresVerification: true,
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified (skip for employees - they are created by contractors)
    if (!user.email_verified && user.role !== 'employee') {
      return res.status(403).json({ 
        error: 'Email nicht verifiziert. Bitte prüfen Sie Ihre Emails.',
        requiresVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        company_name: user.company_name,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Gültige Email-Adresse erforderlich'),
  body('password').isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein'),
  body('role').isIn(['customer', 'contractor', 'employee']).withMessage('Ungültige Rolle'),
  body('first_name').notEmpty().trim().withMessage('Vorname ist erforderlich'),
  body('last_name').notEmpty().trim().withMessage('Nachname ist erforderlich'),
  body('phone').notEmpty().trim().withMessage('Telefonnummer ist erforderlich'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

module.exports = {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation,
};

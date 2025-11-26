const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      company_name,
      company_address,
      company_city, 
      company_postal_code,
      address, 
      city, 
      postal_code,
      tax_id,
      vat_id,
      is_business
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.updateProfile(userId, {
      first_name,
      last_name,
      email,
      phone,
      company_name,
      company_address,
      company_city,
      company_postal_code,
      address,
      city,
      postal_code,
      tax_id,
      vat_id,
      is_business
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

// Update user password
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    await User.updatePassword(userId, hashedPassword);

    res.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error while updating password' });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
};

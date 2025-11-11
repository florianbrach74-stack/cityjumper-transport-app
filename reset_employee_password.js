// Reset password for employee luci.flader@gmx.de
// Run with: railway run node reset_employee_password.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Run with: railway run node reset_employee_password.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function resetPassword() {
  try {
    const email = 'luci.flader@gmx.de';
    const newPassword = 'Test123!'; // Change this to your desired password
    
    console.log('🔐 Resetting password for:', email);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1 
       WHERE email = $2
       RETURNING id, first_name, last_name, email, role`,
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found!');
    } else {
      console.log('✅ Password reset successfully!');
      console.log('User:', result.rows[0]);
      console.log('\n📧 Email:', email);
      console.log('🔑 New Password:', newPassword);
      console.log('\n⚠️  Please change this password after first login!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetPassword();

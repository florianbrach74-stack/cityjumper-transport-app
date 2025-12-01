const pool = require('../config/database');

async function deleteUser() {
  const email = 'brach@nextchain-consulting.com';
  
  try {
    console.log('🗑️  Deleting user with email:', email);
    
    const result = await pool.query(
      'DELETE FROM users WHERE email = $1 RETURNING id, email, first_name, last_name, role',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ User deleted successfully:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Name:', result.rows[0].first_name, result.rows[0].last_name);
      console.log('   Role:', result.rows[0].role);
    } else {
      console.log('⚠️  No user found with email:', email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    process.exit(1);
  }
}

deleteUser();

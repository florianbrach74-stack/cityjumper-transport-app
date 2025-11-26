const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLeoFelke() {
  try {
    console.log('🔍 Checking Leo Felke account...\n');
    
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, email, role, email_verified, first_name, last_name, company_name, created_at FROM users WHERE email = $1',
      ['transportlogistik.felke@gmx.de']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found with email: transportlogistik.felke@gmx.de');
      await pool.end();
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Company: ${user.company_name}`);
    console.log(`   Email verified: ${user.email_verified ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Registered: ${user.created_at}`);
    
    if (!user.email_verified) {
      console.log('\n❌ PROBLEM: Email is NOT verified!');
      console.log('   User cannot login because email_verified = false');
      console.log('\n💡 SOLUTION: Set email_verified = true');
      
      // Fix it
      await pool.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [user.id]
      );
      
      console.log('✅ Email verified flag set to TRUE');
      console.log('   User can now login!');
    } else {
      console.log('\n✅ Email is verified - user should be able to login');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkLeoFelke();

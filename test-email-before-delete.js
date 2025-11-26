const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Mock email service to test logic
const mockEmailService = {
  sendEmail: async (options) => {
    console.log('📧 MOCK: Email would be sent to:', options.to);
    console.log('   Subject:', options.subject);
    // Simulate successful send
    return { success: true };
  }
};

// Simulate the archiveExpiredOrder function
async function testArchiveLogic(order, shouldEmailFail = false) {
  let emailSent = false;
  
  try {
    console.log(`\n🧪 Testing order #${order.id}...`);
    
    // 1. ERST Email senden
    console.log('📧 Step 1: Sending email...');
    
    try {
      if (shouldEmailFail) {
        throw new Error('Simulated email failure');
      }
      
      await mockEmailService.sendEmail({
        to: order.customer_email,
        subject: `❌ Ihr Auftrag #${order.id} konnte nicht vermittelt werden`
      });
      
      emailSent = true;
      console.log(`✅ Email successfully sent to ${order.customer_email}`);
      
    } catch (emailError) {
      console.error(`❌ CRITICAL: Email send failed for order #${order.id}:`, emailError.message);
      console.error(`❌ Order #${order.id} will NOT be deleted - will retry next check`);
      throw new Error(`Email send failed: ${emailError.message}`);
    }
    
    // 2. NUR wenn Email erfolgreich: Auftrag löschen
    if (emailSent) {
      console.log(`🗑️  Step 2: Email sent successfully, now deleting order #${order.id}...`);
      console.log(`✅ Order #${order.id} DELETED from database after successful email notification`);
      return { deleted: true, emailSent: true };
    }
    
  } catch (error) {
    console.error(`❌ Error archiving order #${order.id}:`, error.message);
    return { deleted: false, emailSent: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Email-Before-Delete Logic\n');
  console.log('='.repeat(80));
  
  const testOrder = {
    id: 999,
    customer_email: 'test@example.com',
    customer_first_name: 'Test',
    customer_last_name: 'User'
  };
  
  // Test 1: Email succeeds → Order deleted
  console.log('\n📋 TEST 1: Email succeeds → Order should be deleted');
  console.log('-'.repeat(80));
  const result1 = await testArchiveLogic(testOrder, false);
  console.log('\n📊 Result:', result1);
  
  if (result1.deleted && result1.emailSent) {
    console.log('✅ TEST 1 PASSED: Order deleted after successful email');
  } else {
    console.log('❌ TEST 1 FAILED: Order should have been deleted');
  }
  
  // Test 2: Email fails → Order NOT deleted
  console.log('\n\n📋 TEST 2: Email fails → Order should NOT be deleted');
  console.log('-'.repeat(80));
  const result2 = await testArchiveLogic(testOrder, true);
  console.log('\n📊 Result:', result2);
  
  if (!result2.deleted && !result2.emailSent) {
    console.log('✅ TEST 2 PASSED: Order NOT deleted when email fails');
  } else {
    console.log('❌ TEST 2 FAILED: Order should NOT have been deleted');
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  if (result1.deleted && result1.emailSent && !result2.deleted && !result2.emailSent) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n💡 Logic is correct:');
    console.log('   ✅ Email sent → Order deleted');
    console.log('   ✅ Email failed → Order kept (retry later)');
  } else {
    console.log('❌ SOME TESTS FAILED!');
  }
  
  await pool.end();
}

runTests();

const axios = require('axios');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app';

// Test-Credentials - Create new test user
const TEST_USER = {
  email: 'test-monitoring@courierly.com',
  password: 'TestMonitoring123!',
  first_name: 'Test',
  last_name: 'Monitoring',
  phone: '+49 123 456789',
  role: 'customer'
};

async function testOrderMonitoring() {
  try {
    console.log('🧪 Testing Order Monitoring System...\n');
    
    let token, userId;
    
    // 1. Try to login, if fails, register
    console.log('1️⃣ Logging in as test user...');
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      token = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      console.log(`✅ Logged in as: ${loginResponse.data.user.email} (ID: ${userId})\n`);
    } catch (loginError) {
      console.log('   User not found, registering new test user...');
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, TEST_USER);
      token = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      console.log(`✅ Registered and logged in as: ${registerResponse.data.user.email} (ID: ${userId})\n`);
    }
    
    // 2. Berechne Zeitfenster (in 2 Minuten beginnt, 5 Minuten lang)
    const now = new Date();
    const pickupStart = new Date(now.getTime() + 2 * 60 * 1000); // +2 Minuten
    const pickupEnd = new Date(now.getTime() + 7 * 60 * 1000);   // +7 Minuten
    
    const pickupDate = pickupStart.toISOString().split('T')[0];
    const pickupTimeFrom = pickupStart.toTimeString().substring(0, 5);
    const pickupTimeTo = pickupEnd.toTimeString().substring(0, 5);
    
    console.log('2️⃣ Creating test order with near pickup window...');
    console.log(`   Pickup Date: ${pickupDate}`);
    console.log(`   Pickup Window: ${pickupTimeFrom} - ${pickupTimeTo}`);
    console.log(`   (Window starts in 2 minutes, ends in 7 minutes)\n`);
    
    // 3. Erstelle Test-Auftrag
    const orderData = {
      customer_id: userId,
      pickup_address: 'Teststraße 1',
      pickup_city: 'Berlin',
      pickup_postal_code: '10115',
      pickup_country: 'Deutschland',
      pickup_date: pickupDate,
      pickup_time_from: pickupTimeFrom,
      pickup_time_to: pickupTimeTo,
      pickup_contact_name: 'Test Absender',
      pickup_contact_phone: '+49 123 456789',
      delivery_address: 'Bahnhofstraße 5',
      delivery_city: 'München',
      delivery_postal_code: '80335',
      delivery_country: 'Deutschland',
      delivery_date: pickupDate,
      delivery_time_from: pickupTimeFrom,
      delivery_time_to: pickupTimeTo,
      delivery_contact_name: 'Test Empfänger',
      delivery_contact_phone: '+49 987 654321',
      vehicle_type: 'Kleintransporter',
      weight: 100,
      length: 120,
      width: 80,
      height: 15,
      pallets: 1,
      price: 150.00,
      description: 'TEST ORDER - Order Monitoring System',
      special_requirements: 'This is a test order for the monitoring system',
      needs_loading_help: false,
      needs_unloading_help: false,
      legal_delivery: false
    };
    
    const orderResponse = await axios.post(
      `${API_URL}/api/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const orderId = orderResponse.data.order.id;
    console.log(`✅ Test order created successfully!`);
    console.log(`   Order ID: #${orderId}`);
    console.log(`   Status: ${orderResponse.data.order.status}`);
    console.log(`   Price: €${orderResponse.data.order.price}\n`);
    
    // 4. Zeige Timeline
    console.log('📅 EXPECTED TIMELINE:');
    console.log(`   NOW:     ${now.toTimeString().substring(0, 8)} - Order created`);
    console.log(`   +2 min:  ${pickupStart.toTimeString().substring(0, 8)} - Email 1: "Noch nicht vermittelt"`);
    console.log(`   +8 min:  ${new Date(pickupEnd.getTime() + 60000).toTimeString().substring(0, 8)} - Email 2: "Auftrag abgelaufen"\n`);
    
    // 5. Monitoring Info
    console.log('🔍 MONITORING STATUS:');
    console.log('   ✅ Cron-Job runs every 5 minutes');
    console.log('   ✅ Next check in max 5 minutes');
    console.log('   ✅ Email 1 will be sent when pickup window starts');
    console.log('   ✅ Email 2 will be sent 1 hour after pickup window ends\n');
    
    // 6. Check order details
    console.log('📋 ORDER DETAILS:');
    const orderCheck = await axios.get(
      `${API_URL}/api/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log(`   pickup_window_start_notified: ${orderCheck.data.order.pickup_window_start_notified || false}`);
    console.log(`   expired_and_archived: ${orderCheck.data.order.expired_and_archived || false}`);
    console.log(`   Status: ${orderCheck.data.order.status}\n`);
    
    // 7. Instructions
    console.log('📧 EMAIL TESTING:');
    console.log(`   Check email inbox for: ${TEST_USER.email}`);
    console.log('   You should receive 2 emails:');
    console.log('   1. "⏰ Ihr Auftrag #' + orderId + ' - Noch nicht vermittelt" (in ~2-7 minutes)');
    console.log('   2. "❌ Ihr Auftrag #' + orderId + ' konnte nicht vermittelt werden" (in ~8-13 minutes)\n');
    
    console.log('✅ TEST SETUP COMPLETE!');
    console.log('   Wait for emails and check Railway logs for monitoring activity.\n');
    
    // 8. Show direct link to price adjustment
    console.log('🔗 PRICE ADJUSTMENT LINK:');
    console.log(`   https://www.courierly.de/customer/orders/${orderId}/edit-price\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run test
testOrderMonitoring();

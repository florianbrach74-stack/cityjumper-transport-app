const axios = require('axios');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

async function testAPILogin() {
  try {
    console.log('🔍 Testing API login...\n');
    
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test 2: Login with contractor credentials
    console.log('\n2️⃣ Testing login endpoint...');
    const loginData = {
      email: 'florianbrach@gmx.de',
      password: 'Test1234!' // You'll need to use the actual password
    };
    
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
      console.log('✅ Login successful!');
      console.log('   Token:', loginResponse.data.token ? 'Present' : 'Missing');
      console.log('   User:', loginResponse.data.user);
    } catch (loginError) {
      console.log('❌ Login failed:');
      console.log('   Status:', loginError.response?.status);
      console.log('   Error:', loginError.response?.data);
      console.log('   Message:', loginError.message);
    }
    
    // Test 3: Try with customer credentials
    console.log('\n3️⃣ Testing with customer account...');
    const customerData = {
      email: 'florianbrach74@gmail.com',
      password: 'Test1234!' // You'll need to use the actual password
    };
    
    try {
      const customerResponse = await axios.post(`${API_URL}/auth/login`, customerData);
      console.log('✅ Customer login successful!');
      console.log('   User:', customerResponse.data.user);
      
      // Test 4: Get orders for customer
      console.log('\n4️⃣ Testing orders endpoint...');
      const ordersResponse = await axios.get(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${customerResponse.data.token}`
        }
      });
      console.log('✅ Orders fetched:', ordersResponse.data.orders.length, 'orders');
      console.log('   First order:', ordersResponse.data.orders[0]?.id, ordersResponse.data.orders[0]?.status);
    } catch (customerError) {
      console.log('❌ Customer test failed:');
      console.log('   Status:', customerError.response?.status);
      console.log('   Error:', customerError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPILogin();

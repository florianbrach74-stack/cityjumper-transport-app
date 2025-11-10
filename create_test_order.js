const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_PUBLIC_URL for Railway external connections
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function createTestOrder() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating test order for email notification...\n');
    
    // Get admin user
    const adminResult = await client.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (adminResult.rows.length === 0) {
      console.error('❌ No admin user found!');
      return;
    }
    
    const adminId = adminResult.rows[0].id;
    console.log('✅ Found admin user:', adminId);
    
    // Create test order
    const orderData = {
      customer_id: adminId,
      pickup_address: 'Hauptstraße 1',
      pickup_city: 'Berlin',
      pickup_postal_code: '10115',
      pickup_country: 'Deutschland',
      pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      pickup_time: '10:00',
      delivery_address: 'Bahnhofstraße 5',
      delivery_city: 'München',
      delivery_postal_code: '80335',
      delivery_country: 'Deutschland',
      vehicle_type: 'Kleintransporter',
      price: 450.00,
      status: 'pending',
      description: '📧 TEST-AUFTRAG für Email-Benachrichtigungen',
      distance_km: 584,
      duration_minutes: 383
    };
    
    const result = await client.query(
      `INSERT INTO transport_orders (
        customer_id, pickup_address, pickup_city, pickup_postal_code, pickup_country,
        pickup_date, pickup_time, delivery_address, delivery_city, delivery_postal_code,
        delivery_country, vehicle_type, price, status, description, distance_km, duration_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        orderData.customer_id, orderData.pickup_address, orderData.pickup_city,
        orderData.pickup_postal_code, orderData.pickup_country, orderData.pickup_date,
        orderData.pickup_time, orderData.delivery_address, orderData.delivery_city,
        orderData.delivery_postal_code, orderData.delivery_country, orderData.vehicle_type,
        orderData.price, orderData.status, orderData.description, orderData.distance_km,
        orderData.duration_minutes
      ]
    );
    
    const orderId = result.rows[0].id;
    
    console.log('\n✅ Test order created successfully!');
    console.log('📦 Order ID:', orderId);
    console.log('📍 Route:', orderData.pickup_city, '→', orderData.delivery_city);
    console.log('💰 Price:', orderData.price, '€');
    console.log('📏 Distance:', orderData.distance_km, 'km');
    console.log('⏱️  Duration:', orderData.duration_minutes, 'min');
    console.log('\n📧 Email notifications should be sent to contractors with matching PLZ notifications!');
    console.log('\n🔍 Check Railway logs for email sending confirmation');
    console.log('📬 Check webmail.one.com for received emails');
    
  } catch (error) {
    console.error('❌ Error creating test order:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestOrder();

const pool = require('./server/config/database');

const orders = [
  {
    pickup_address: 'Reeperbahn 154',
    pickup_city: 'Hamburg',
    pickup_postal_code: '20359',
    pickup_contact_name: 'Klaus Schmidt',
    pickup_contact_phone: '+49 40 123456',
    pickup_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pickup_time_from: '08:00',
    pickup_time_to: '12:00',
    delivery_address: 'Marienplatz 8',
    delivery_city: 'München',
    delivery_postal_code: '80331',
    delivery_contact_name: 'Maria Weber',
    delivery_contact_phone: '+49 89 654321',
    delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delivery_time_from: '08:00',
    delivery_time_to: '12:00',
    vehicle_type: 'Mittlerer Transporter (bis 4 Paletten)',
    weight: 350.00,
    pallets: 3,
    description: '3 Paletten mit Elektronik',
    price: 520.00,
    distance_km: 775,
    duration_minutes: 450
  },
  {
    pickup_address: 'Alexanderplatz 1',
    pickup_city: 'Berlin',
    pickup_postal_code: '10178',
    pickup_contact_name: 'Thomas Müller',
    pickup_contact_phone: '+49 30 987654',
    pickup_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pickup_time_from: '09:00',
    pickup_time_to: '13:00',
    delivery_address: 'Zeil 106',
    delivery_city: 'Frankfurt am Main',
    delivery_postal_code: '60313',
    delivery_contact_name: 'Anna Fischer',
    delivery_contact_phone: '+49 69 456789',
    delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delivery_time_from: '09:00',
    delivery_time_to: '13:00',
    vehicle_type: 'Kleintransporter (bis 2 Paletten)',
    weight: 150.00,
    pallets: 2,
    description: '2 Paletten mit Büromaterial',
    price: 380.00,
    distance_km: 550,
    duration_minutes: 320
  },
  {
    pickup_address: 'Hohe Straße 1',
    pickup_city: 'Köln',
    pickup_postal_code: '50667',
    pickup_contact_name: 'Peter Wagner',
    pickup_contact_phone: '+49 221 111222',
    pickup_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pickup_time_from: '10:00',
    pickup_time_to: '14:00',
    delivery_address: 'Königstraße 1A',
    delivery_city: 'Stuttgart',
    delivery_postal_code: '70173',
    delivery_contact_name: 'Sophie Becker',
    delivery_contact_phone: '+49 711 333444',
    delivery_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delivery_time_from: '10:00',
    delivery_time_to: '14:00',
    vehicle_type: 'Großer Transporter (bis 6 Paletten)',
    weight: 500.00,
    pallets: 5,
    description: '5 Paletten mit Maschinen',
    price: 650.00,
    distance_km: 420,
    duration_minutes: 280
  }
];

async function createTestOrders() {
  try {
    console.log('🔍 Finding customer...');
    const customerResult = await pool.query(
      "SELECT id FROM users WHERE role = 'customer' LIMIT 1"
    );
    
    if (customerResult.rows.length === 0) {
      console.error('❌ No customer found in database');
      process.exit(1);
    }
    
    const customerId = customerResult.rows[0].id;
    console.log(`✅ Found customer ID: ${customerId}`);
    
    console.log('\n📦 Creating 3 test orders...\n');
    
    for (const order of orders) {
      const result = await pool.query(
        `INSERT INTO transport_orders (
          customer_id, pickup_address, pickup_city, pickup_postal_code,
          pickup_contact_name, pickup_contact_phone, pickup_date,
          pickup_time_from, pickup_time_to, delivery_address, delivery_city,
          delivery_postal_code, delivery_contact_name, delivery_contact_phone,
          delivery_date, delivery_time_from, delivery_time_to, vehicle_type,
          weight, pallets, description, price, status, distance_km, duration_minutes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'pending', $23, $24
        ) RETURNING id, pickup_city, delivery_city, price`,
        [
          customerId,
          order.pickup_address,
          order.pickup_city,
          order.pickup_postal_code,
          order.pickup_contact_name,
          order.pickup_contact_phone,
          order.pickup_date,
          order.pickup_time_from,
          order.pickup_time_to,
          order.delivery_address,
          order.delivery_city,
          order.delivery_postal_code,
          order.delivery_contact_name,
          order.delivery_contact_phone,
          order.delivery_date,
          order.delivery_time_from,
          order.delivery_time_to,
          order.vehicle_type,
          order.weight,
          order.pallets,
          order.description,
          order.price,
          order.distance_km,
          order.duration_minutes
        ]
      );
      
      const created = result.rows[0];
      console.log(`✅ Order #${created.id}: ${created.pickup_city} → ${created.delivery_city} (€${created.price})`);
    }
    
    console.log('\n🎉 All 3 orders created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating orders:', error);
    process.exit(1);
  }
}

createTestOrders();

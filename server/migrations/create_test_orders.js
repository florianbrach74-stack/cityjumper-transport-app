const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestOrders() {
  try {
    console.log('🔄 Creating 5 test orders...');
    
    // Get customer ID (assuming ID 1 is a customer)
    const customerResult = await pool.query(
      "SELECT id FROM users WHERE role = 'customer' LIMIT 1"
    );
    
    if (customerResult.rows.length === 0) {
      console.error('❌ No customer found in database');
      process.exit(1);
    }
    
    const customerId = customerResult.rows[0].id;
    console.log(`✅ Using customer ID: ${customerId}`);
    
    const testOrders = [
      {
        pickup_address: 'Hauptstraße 123',
        pickup_city: 'München',
        pickup_postal_code: '80331',
        pickup_country: 'Deutschland',
        pickup_date: '2025-10-30',
        pickup_time: '10:00',
        pickup_contact_name: 'Hans Müller',
        pickup_contact_phone: '+49 89 123456',
        delivery_address: 'Berliner Allee 45',
        delivery_city: 'Berlin',
        delivery_postal_code: '10115',
        delivery_country: 'Deutschland',
        delivery_contact_name: 'Anna Schmidt',
        delivery_contact_phone: '+49 30 987654',
        vehicle_type: 'Kleintransporter (bis 2 Paletten)',
        weight: 150.00,
        pallets: 2,
        description: '2 Paletten mit Büromöbeln',
        price: 450.00
      },
      {
        pickup_address: 'Industrieweg 78',
        pickup_city: 'Köln',
        pickup_postal_code: '50667',
        pickup_country: 'Deutschland',
        pickup_date: '2025-10-31',
        pickup_time: '08:00',
        pickup_contact_name: 'Thomas Weber',
        pickup_contact_phone: '+49 221 555666',
        delivery_address: 'Hafenstraße 12',
        delivery_city: 'Hamburg',
        delivery_postal_code: '20457',
        delivery_country: 'Deutschland',
        delivery_contact_name: 'Lisa Becker',
        delivery_contact_phone: '+49 40 777888',
        vehicle_type: 'Mittlerer Transporter (bis 4 Paletten)',
        weight: 300.00,
        pallets: 4,
        description: '4 Paletten mit Maschinen',
        price: 580.00
      },
      {
        pickup_address: 'Bahnhofstraße 56',
        pickup_city: 'Stuttgart',
        pickup_postal_code: '70173',
        pickup_country: 'Deutschland',
        pickup_date: '2025-11-01',
        pickup_time: '14:00',
        pickup_contact_name: 'Michael Klein',
        pickup_contact_phone: '+49 711 333444',
        delivery_address: 'Rheinufer 89',
        delivery_city: 'Düsseldorf',
        delivery_postal_code: '40213',
        delivery_country: 'Deutschland',
        delivery_contact_name: 'Sarah Fischer',
        delivery_contact_phone: '+49 211 222333',
        vehicle_type: 'Großer Transporter (bis 6 Paletten)',
        weight: 450.00,
        pallets: 6,
        description: '6 Paletten mit Baumaterialien',
        price: 720.00
      },
      {
        pickup_address: 'Marktplatz 34',
        pickup_city: 'Leipzig',
        pickup_postal_code: '04109',
        pickup_country: 'Deutschland',
        pickup_date: '2025-11-02',
        pickup_time: '09:30',
        pickup_contact_name: 'Julia Hoffmann',
        pickup_contact_phone: '+49 341 666777',
        delivery_address: 'Königsallee 23',
        delivery_city: 'Dresden',
        delivery_postal_code: '01067',
        delivery_country: 'Deutschland',
        delivery_contact_name: 'Peter Schulz',
        delivery_contact_phone: '+49 351 888999',
        vehicle_type: 'Kleintransporter (bis 2 Paletten)',
        weight: 100.00,
        pallets: 1,
        description: '1 Palette mit Elektronik',
        price: 320.00
      },
      {
        pickup_address: 'Gartenstraße 67',
        pickup_city: 'Nürnberg',
        pickup_postal_code: '90402',
        pickup_country: 'Deutschland',
        pickup_date: '2025-11-03',
        pickup_time: '11:00',
        pickup_contact_name: 'Stefan Wagner',
        pickup_contact_phone: '+49 911 444555',
        delivery_address: 'Seestraße 90',
        delivery_city: 'Hannover',
        delivery_postal_code: '30159',
        delivery_country: 'Deutschland',
        delivery_contact_name: 'Claudia Meyer',
        delivery_contact_phone: '+49 511 111222',
        vehicle_type: 'Mittlerer Transporter (bis 4 Paletten)',
        weight: 250.00,
        pallets: 3,
        description: '3 Paletten mit Lebensmitteln',
        price: 520.00
      }
    ];
    
    for (let i = 0; i < testOrders.length; i++) {
      const order = testOrders[i];
      await pool.query(`
        INSERT INTO transport_orders (
          customer_id, pickup_address, pickup_city, pickup_postal_code, pickup_country,
          pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone,
          delivery_address, delivery_city, delivery_postal_code, delivery_country,
          delivery_contact_name, delivery_contact_phone, vehicle_type, weight, pallets,
          description, price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        customerId, order.pickup_address, order.pickup_city, order.pickup_postal_code, order.pickup_country,
        order.pickup_date, order.pickup_time, order.pickup_contact_name, order.pickup_contact_phone,
        order.delivery_address, order.delivery_city, order.delivery_postal_code, order.delivery_country,
        order.delivery_contact_name, order.delivery_contact_phone, order.vehicle_type, order.weight, order.pallets,
        order.description, order.price, 'pending'
      ]);
      console.log(`✅ Order ${i + 1}/5 created: ${order.pickup_city} → ${order.delivery_city}`);
    }
    
    console.log('🎉 All 5 test orders created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test orders:', error);
    process.exit(1);
  }
}

createTestOrders();

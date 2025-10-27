const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Railway Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Erstelle Test-Daten...\n');
    
    // 1. Test-Kunde erstellen
    console.log('👤 Erstelle Test-Kunde...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const customerResult = await client.query(`
      INSERT INTO users (
        email, password, first_name, last_name, role, phone, company_name
      ) VALUES (
        'kunde@test.de', $1, 'Max', 'Mustermann', 'customer',
        '+49 123 456789', 'Mustermann GmbH'
      )
      ON CONFLICT (email) DO UPDATE SET first_name = 'Max'
      RETURNING id, email, first_name, last_name
    `, [hashedPassword]);
    
    const customer = customerResult.rows[0];
    console.log(`✅ Kunde erstellt: ${customer.first_name} ${customer.last_name} (${customer.email})`);
    
    // 2. Ersten Auftrag erstellen (Berlin → München)
    console.log('\n📦 Erstelle Auftrag 1: Berlin → München...');
    const order1Result = await client.query(`
      INSERT INTO transport_orders (
        customer_id, 
        pickup_address, pickup_city, pickup_postal_code, pickup_country,
        pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_postal_code, delivery_country,
        delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone,
        vehicle_type, weight, length, width, height, pallets,
        description, price, status
      ) VALUES (
        $1,
        'Bukesweg 29', 'Berlin', '12557', 'Deutschland',
        CURRENT_DATE, '10:00', 'Max Mustermann', '+49 123 456789',
        'Marienplatz 1', 'München', '80331', 'Deutschland',
        CURRENT_DATE, '16:00', 'Anna Schmidt', '+49 987 654321',
        'Kleintransporter', 100, 120, 80, 15, 1,
        'Europalette mit Waren', 488.21, 'pending'
      )
      RETURNING id, pickup_city, delivery_city, price
    `, [customer.id]);
    
    const order1 = order1Result.rows[0];
    console.log(`✅ Auftrag #${order1.id}: ${order1.pickup_city} → ${order1.delivery_city} (€${order1.price})`);
    
    // 3. Zweiten Auftrag erstellen (Hamburg → Frankfurt)
    console.log('\n📦 Erstelle Auftrag 2: Hamburg → Frankfurt...');
    const order2Result = await client.query(`
      INSERT INTO transport_orders (
        customer_id,
        pickup_address, pickup_city, pickup_postal_code, pickup_country,
        pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_postal_code, delivery_country,
        delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone,
        vehicle_type, weight, length, width, height, pallets,
        description, price, status
      ) VALUES (
        $1,
        'Reeperbahn 1', 'Hamburg', '20359', 'Deutschland',
        CURRENT_DATE + INTERVAL '1 day', '09:00', 'Max Mustermann', '+49 123 456789',
        'Römerberg 1', 'Frankfurt am Main', '60311', 'Deutschland',
        CURRENT_DATE + INTERVAL '1 day', '14:00', 'Peter Müller', '+49 456 789123',
        'Mittlerer Transporter (bis 4 Paletten)', 200, 120, 80, 30, 2,
        '2 Paletten mit Elektronik', 356.50, 'pending'
      )
      RETURNING id, pickup_city, delivery_city, price
    `, [customer.id]);
    
    const order2 = order2Result.rows[0];
    console.log(`✅ Auftrag #${order2.id}: ${order2.pickup_city} → ${order2.delivery_city} (€${order2.price})`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST-DATEN ERFOLGREICH ERSTELLT!');
    console.log('='.repeat(60));
    console.log('\n📋 LOGIN-DATEN:');
    console.log('─'.repeat(60));
    console.log('👤 Test-Kunde:');
    console.log(`   Email:    kunde@test.de`);
    console.log(`   Passwort: test123`);
    console.log(`   Name:     ${customer.first_name} ${customer.last_name}`);
    console.log('\n📦 Aufträge:');
    console.log(`   Auftrag #${order1.id}: ${order1.pickup_city} → ${order1.delivery_city} (€${order1.price})`);
    console.log(`   Auftrag #${order2.id}: ${order2.pickup_city} → ${order2.delivery_city} (€${order2.price})`);
    console.log('\n🚀 NÄCHSTE SCHRITTE:');
    console.log('─'.repeat(60));
    console.log('1. Loggen Sie sich als Auftragnehmer ein');
    console.log('2. Gehen Sie zu "Verfügbare Aufträge"');
    console.log('3. Nehmen Sie einen Auftrag an');
    console.log('4. CMR wird automatisch erstellt');
    console.log('5. Testen Sie Unterschrift oder Foto-Upload!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

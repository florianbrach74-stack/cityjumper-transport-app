const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testSavedRoutes() {
  try {
    console.log('🧪 Testing Saved Routes Feature...\n');
    
    // 1. Find a customer to test with
    console.log('1️⃣ Finding a customer...');
    const customerResult = await pool.query(`
      SELECT id, email, first_name, last_name, company_name 
      FROM users 
      WHERE role = 'customer' 
      LIMIT 1
    `);
    
    if (customerResult.rows.length === 0) {
      console.log('❌ No customer found');
      await pool.end();
      return;
    }
    
    const customer = customerResult.rows[0];
    console.log(`✅ Found customer: ${customer.first_name} ${customer.last_name} (${customer.email})`);
    console.log(`   Customer ID: ${customer.id}\n`);
    
    // 2. Create a test saved route
    console.log('2️⃣ Creating test saved route...');
    const routeData = {
      customer_id: customer.id,
      route_name: 'Test Route: Berlin → Hamburg',
      pickup_address: 'Alexanderplatz 1',
      pickup_city: 'Berlin',
      pickup_postal_code: '10178',
      pickup_country: 'Deutschland',
      pickup_company: customer.company_name || 'Test Firma',
      pickup_contact_name: `${customer.first_name} ${customer.last_name}`,
      pickup_contact_phone: '+49 30 12345678',
      delivery_address: 'Reeperbahn 123',
      delivery_city: 'Hamburg',
      delivery_postal_code: '20359',
      delivery_country: 'Deutschland',
      delivery_company: 'Empfänger GmbH',
      delivery_contact_name: 'Max Mustermann',
      delivery_contact_phone: '+49 40 98765432',
      cargo_description: 'Europaletten mit Elektronik',
      cargo_weight: 250.5,
      cargo_length: 120,
      cargo_width: 80,
      cargo_height: 15
    };
    
    const insertResult = await pool.query(`
      INSERT INTO saved_routes (
        customer_id, route_name,
        pickup_address, pickup_city, pickup_postal_code, pickup_country,
        pickup_company, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_postal_code, delivery_country,
        delivery_company, delivery_contact_name, delivery_contact_phone,
        cargo_description, cargo_weight, cargo_length, cargo_width, cargo_height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      routeData.customer_id,
      routeData.route_name,
      routeData.pickup_address,
      routeData.pickup_city,
      routeData.pickup_postal_code,
      routeData.pickup_country,
      routeData.pickup_company,
      routeData.pickup_contact_name,
      routeData.pickup_contact_phone,
      routeData.delivery_address,
      routeData.delivery_city,
      routeData.delivery_postal_code,
      routeData.delivery_country,
      routeData.delivery_company,
      routeData.delivery_contact_name,
      routeData.delivery_contact_phone,
      routeData.cargo_description,
      routeData.cargo_weight,
      routeData.cargo_length,
      routeData.cargo_width,
      routeData.cargo_height
    ]);
    
    const savedRoute = insertResult.rows[0];
    console.log('✅ Route saved successfully!');
    console.log(`   Route ID: ${savedRoute.id}`);
    console.log(`   Route Name: ${savedRoute.route_name}\n`);
    
    // 3. Simulate using the route (increment usage count)
    console.log('3️⃣ Simulating route usage...');
    await pool.query(`
      UPDATE saved_routes 
      SET usage_count = usage_count + 1,
          last_used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [savedRoute.id]);
    console.log('✅ Usage count incremented\n');
    
    // 4. Retrieve and display the saved route
    console.log('4️⃣ Retrieving saved route...');
    const retrieveResult = await pool.query(`
      SELECT * FROM saved_routes WHERE customer_id = $1
    `, [customer.id]);
    
    if (retrieveResult.rows.length === 0) {
      console.log('❌ Route not found');
    } else {
      const route = retrieveResult.rows[0];
      console.log('✅ Route retrieved successfully!\n');
      console.log('📋 Route Details:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🌟 Route Name: ${route.route_name}`);
      console.log(`📊 Usage Count: ${route.usage_count}`);
      console.log(`🕐 Last Used: ${route.last_used_at ? new Date(route.last_used_at).toLocaleString('de-DE') : 'Never'}`);
      console.log(`📅 Created: ${new Date(route.created_at).toLocaleString('de-DE')}`);
      console.log('');
      console.log('📍 ABHOLUNG:');
      console.log(`   Firma: ${route.pickup_company}`);
      console.log(`   Adresse: ${route.pickup_address}`);
      console.log(`   Ort: ${route.pickup_postal_code} ${route.pickup_city}, ${route.pickup_country}`);
      console.log(`   Kontakt: ${route.pickup_contact_name}`);
      console.log(`   Telefon: ${route.pickup_contact_phone}`);
      console.log('');
      console.log('📍 ZUSTELLUNG:');
      console.log(`   Firma: ${route.delivery_company}`);
      console.log(`   Adresse: ${route.delivery_address}`);
      console.log(`   Ort: ${route.delivery_postal_code} ${route.delivery_city}, ${route.delivery_country}`);
      console.log(`   Kontakt: ${route.delivery_contact_name}`);
      console.log(`   Telefon: ${route.delivery_contact_phone}`);
      console.log('');
      console.log('📦 CARGO:');
      console.log(`   Beschreibung: ${route.cargo_description}`);
      console.log(`   Gewicht: ${route.cargo_weight} kg`);
      console.log(`   Maße: ${route.cargo_length} x ${route.cargo_width} x ${route.cargo_height} cm`);
      console.log('═══════════════════════════════════════════════════════════');
    }
    
    // 5. Show all saved routes for this customer
    console.log('\n5️⃣ All saved routes for this customer:');
    const allRoutes = await pool.query(`
      SELECT id, route_name, usage_count, last_used_at, created_at
      FROM saved_routes 
      WHERE customer_id = $1
      ORDER BY usage_count DESC, route_name ASC
    `, [customer.id]);
    
    console.log(`\n📊 Total routes: ${allRoutes.rows.length}`);
    allRoutes.rows.forEach((r, index) => {
      console.log(`\n${index + 1}. ${r.route_name}`);
      console.log(`   ID: ${r.id}`);
      console.log(`   Used: ${r.usage_count} times`);
      console.log(`   Last used: ${r.last_used_at ? new Date(r.last_used_at).toLocaleString('de-DE') : 'Never'}`);
      console.log(`   Created: ${new Date(r.created_at).toLocaleString('de-DE')}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Login as this customer in the frontend');
    console.log('   2. Click "Neuer Auftrag"');
    console.log('   3. Click "Gespeicherte Routen" button');
    console.log('   4. You should see: "Test Route: Berlin → Hamburg"');
    console.log('   5. Click "Route verwenden" to auto-fill the form');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testSavedRoutes();

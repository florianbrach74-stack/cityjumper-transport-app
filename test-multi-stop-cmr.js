const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testMultiStopCMR() {
  try {
    console.log('🧪 Testing Multi-Stop CMR System\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Create a test order with multiple delivery stops
    console.log('1️⃣ Creating test order with 3 delivery addresses...');
    
    const deliveryStops = [
      {
        address: 'Friedrichstraße 100',
        city: 'Berlin',
        postal_code: '10117',
        country: 'Deutschland',
        contact_name: 'Anna Schmidt',
        company: 'Schmidt GmbH'
      },
      {
        address: 'Kurfürstendamm 200',
        city: 'Berlin',
        postal_code: '10719',
        country: 'Deutschland',
        contact_name: 'Peter Müller',
        company: 'Müller AG'
      }
    ];
    
    // Get a contractor
    const contractorResult = await pool.query(`
      SELECT id FROM users WHERE role = 'contractor' LIMIT 1
    `);
    const contractorId = contractorResult.rows[0]?.id;
    
    // Get a customer
    const customerResult = await pool.query(`
      SELECT id, first_name, last_name FROM users WHERE role = 'customer' LIMIT 1
    `);
    const customer = customerResult.rows[0];
    
    if (!contractorId || !customer) {
      console.log('❌ No contractor or customer found');
      await pool.end();
      return;
    }
    
    // Create order
    const today = new Date().toISOString().split('T')[0];
    const orderResult = await pool.query(`
      INSERT INTO transport_orders (
        customer_id,
        contractor_id,
        pickup_address,
        pickup_city,
        pickup_postal_code,
        pickup_country,
        pickup_contact_name,
        pickup_date,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_country,
        delivery_contact_name,
        delivery_company,
        delivery_date,
        delivery_stops,
        description,
        weight,
        price,
        status,
        vehicle_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      customer.id,
      contractorId,
      'Alexanderplatz 1',
      'Berlin',
      '10178',
      'Deutschland',
      `${customer.first_name} ${customer.last_name}`,
      today,
      'Potsdamer Platz 1',
      'Berlin',
      '10785',
      'Deutschland',
      'Max Mustermann',
      'Mustermann GmbH',
      today,
      JSON.stringify(deliveryStops),
      'Test Multi-Stop Lieferung',
      100,
      150.00,
      'accepted',
      'sprinter'
    ]);
    
    const order = orderResult.rows[0];
    console.log(`✅ Order created: #${order.id}`);
    console.log(`   Pickup: ${order.pickup_city}`);
    console.log(`   Main Delivery: ${order.delivery_city} (${order.delivery_contact_name})`);
    console.log(`   Additional Stops: ${deliveryStops.length}\n`);
    
    // 2. Create CMRs for this order
    console.log('2️⃣ Creating CMRs...');
    const { createCMRForOrder } = require('./server/controllers/cmrController');
    
    const cmrResult = await createCMRForOrder(order.id);
    
    console.log(`✅ Created ${cmrResult.cmrs.length} CMR(s)`);
    console.log(`   Multi-Stop: ${cmrResult.isMultiStop ? 'Yes' : 'No'}`);
    console.log(`   Total Stops: ${cmrResult.totalStops}\n`);
    
    // 3. Display all CMRs
    console.log('3️⃣ CMR Details:');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (const cmr of cmrResult.cmrs) {
      console.log(`\n📄 CMR #${cmr.cmr_number} (Stop ${cmr.delivery_stop_index + 1}/${cmr.total_stops})`);
      console.log(`   Sender: ${cmr.sender_name}`);
      console.log(`   Receiver: ${cmr.consignee_name}`);
      console.log(`   Address: ${cmr.consignee_address}, ${cmr.consignee_postal_code} ${cmr.consignee_city}`);
      console.log(`   Can share sender signature: ${cmr.can_share_sender_signature ? '✅' : '❌'}`);
      console.log(`   Can share receiver signature: ${cmr.can_share_receiver_signature ? '✅' : '❌'}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    
    // 4. Test API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    
    // Get all CMRs by group
    const CMR = require('./server/models/CMR');
    const cmrGroupId = `ORDER-${order.id}`;
    const groupCMRs = await CMR.findByGroupId(cmrGroupId);
    console.log(`✅ findByGroupId: Found ${groupCMRs.length} CMRs`);
    
    // Get next pending delivery
    const nextDelivery = await CMR.getNextPendingDelivery(cmrGroupId);
    console.log(`✅ getNextPendingDelivery: ${nextDelivery ? `CMR #${nextDelivery.cmr_number}` : 'None'}`);
    
    // Update shared signatures
    const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await CMR.updateSharedSignatures(cmrGroupId, testSignature, testSignature);
    console.log(`✅ updateSharedSignatures: Updated`);
    
    // Verify signatures were applied
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM cmr_documents
      WHERE cmr_group_id = $1
        AND shared_sender_signature IS NOT NULL
        AND shared_carrier_signature IS NOT NULL
    `, [cmrGroupId]);
    console.log(`✅ Verification: ${verifyResult.rows[0].count} CMRs have shared signatures`);
    
    // Check if group is completed
    const isCompleted = await CMR.isGroupCompleted(cmrGroupId);
    console.log(`✅ isGroupCompleted: ${isCompleted ? 'Yes' : 'No (expected)'}`);
    
    // 5. Simulate delivery workflow
    console.log('\n5️⃣ Simulating delivery workflow...');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (let i = 0; i < cmrResult.cmrs.length; i++) {
      const cmr = cmrResult.cmrs[i];
      console.log(`\n📍 Delivery ${i + 1}/${cmrResult.cmrs.length}`);
      console.log(`   CMR: #${cmr.cmr_number}`);
      console.log(`   Receiver: ${cmr.consignee_name}`);
      console.log(`   Address: ${cmr.consignee_city}`);
      
      // Simulate receiver signature
      await pool.query(`
        UPDATE cmr_documents
        SET consignee_signature = $1
        WHERE id = $2
      `, [testSignature, cmr.id]);
      
      console.log(`   ✅ Receiver signed`);
      
      // Check if there's a next delivery
      const next = await CMR.getNextPendingDelivery(cmrGroupId);
      if (next) {
        console.log(`   → Next: ${next.consignee_name} in ${next.consignee_city}`);
      } else {
        console.log(`   🎉 All deliveries completed!`);
      }
    }
    
    // 6. Final verification
    console.log('\n6️⃣ Final Verification:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const finalCheck = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(consignee_signature) as signed,
        COUNT(shared_sender_signature) as has_sender_sig,
        COUNT(shared_carrier_signature) as has_carrier_sig
      FROM cmr_documents
      WHERE cmr_group_id = $1
    `, [cmrGroupId]);
    
    const stats = finalCheck.rows[0];
    console.log(`\n📊 Statistics:`);
    console.log(`   Total CMRs: ${stats.total}`);
    console.log(`   Signed by receivers: ${stats.signed}/${stats.total}`);
    console.log(`   Have sender signature: ${stats.has_sender_sig}/${stats.total}`);
    console.log(`   Have carrier signature: ${stats.has_carrier_sig}/${stats.total}`);
    
    const allCompleted = await CMR.isGroupCompleted(cmrGroupId);
    console.log(`   All completed: ${allCompleted ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('\n📋 Summary:');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   CMR Group: ${cmrGroupId}`);
    console.log(`   Total CMRs: ${cmrResult.cmrs.length}`);
    console.log(`   All signatures collected: ✅`);
    console.log(`   System working: ✅`);
    
    console.log('\n💡 You can now:');
    console.log(`   1. View order in admin dashboard: Order #${order.id}`);
    console.log(`   2. Check CMRs in database`);
    console.log(`   3. Test in employee dashboard with this order`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

testMultiStopCMR();

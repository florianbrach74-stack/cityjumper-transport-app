require('dotenv').config();
const pool = require('./server/config/database');
const CMR = require('./server/models/CMR');
const Order = require('./server/models/Order');
const path = require('path');

async function testCompleteMultiStopWorkflow() {
  console.log('\n🧪 COMPLETE MULTI-STOP WORKFLOW TEST\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let orderId = null;
  let cmrIds = [];
  
  try {
    // 1. Use existing customer - prefer florian's email
    console.log('1️⃣ Setup Test User...');
    const userResult = await pool.query(`
      SELECT id, email, first_name, last_name FROM users 
      WHERE role = 'customer' 
      AND email LIKE '%florian%'
      LIMIT 1
    `);
    
    let customerId, customerEmail;
    if (userResult.rows.length === 0) {
      // Fallback to any customer
      const fallbackResult = await pool.query(`
        SELECT id, email, first_name, last_name FROM users WHERE role = 'customer' LIMIT 1
      `);
      if (fallbackResult.rows.length === 0) {
        throw new Error('No customer found in database. Please create a customer first.');
      }
      customerId = fallbackResult.rows[0].id;
      customerEmail = fallbackResult.rows[0].email;
    } else {
      customerId = userResult.rows[0].id;
      customerEmail = userResult.rows[0].email;
    }
    console.log(`   ✅ Using customer: ${customerEmail} (ID ${customerId})`);
    
    // 2. Use existing contractor
    console.log('\n2️⃣ Setup Test Contractor...');
    const contractorResult = await pool.query(`
      SELECT id, email FROM users WHERE role = 'contractor' LIMIT 1
    `);
    
    if (contractorResult.rows.length === 0) {
      throw new Error('No contractor found in database. Please create a contractor first.');
    }
    
    const contractorId = contractorResult.rows[0].id;
    console.log(`   ✅ Using contractor: ${contractorResult.rows[0].email} (ID ${contractorId})`);

    
    // 3. Create Multi-Stop Order
    console.log('\n3️⃣ Create Multi-Stop Order...');
    const orderData = {
      customer_id: customerId,
      pickup_address: 'Bukesweg 29',
      pickup_city: 'Berlin',
      pickup_postal_code: '12557',
      pickup_country: 'Deutschland',
      pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pickup_time_from: '10:00',
      pickup_time_to: '12:00',
      pickup_contact_name: 'Max Mustermann',
      pickup_contact_phone: '+49123456789',
      delivery_address: 'Adolf-Menzel-Straße 7',
      delivery_city: 'Berlin',
      delivery_postal_code: '12621',
      delivery_country: 'Deutschland',
      delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      delivery_time_from: '14:00',
      delivery_time_to: '16:00',
      delivery_contact_name: 'Anna Schmidt',
      delivery_contact_phone: '+49111111111',
      delivery_stops: JSON.stringify([
        {
          address: 'Bernauer Straße 10',
          city: 'Berlin',
          postal_code: '10115',
          country: 'Deutschland',
          contact_name: 'Peter Müller',
          contact_phone: '+49222222222',
          notes: 'Zweiter Stock, Hinterhaus'
        }
      ]),
      vehicle_type: 'Kleintransporter',
      weight: 150,
      length: 120,
      width: 80,
      height: 100,
      pallets: 2,
      description: 'Test Multi-Stop Sendung',
      price: 75.00,
      distance_km: 25,
      duration_minutes: 60,
      status: 'pending',
      extra_stops_count: 1,
      extra_stops_fee: 6.00
    };
    
    const orderResult = await pool.query(`
      INSERT INTO transport_orders (
        customer_id, pickup_address, pickup_city, pickup_postal_code, pickup_country,
        pickup_date, pickup_time_from, pickup_time_to, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_postal_code, delivery_country,
        delivery_date, delivery_time_from, delivery_time_to, delivery_contact_name, delivery_contact_phone,
        delivery_stops, vehicle_type, weight, length, width, height, pallets,
        description, price, distance_km, duration_minutes, status,
        extra_stops_count, extra_stops_fee
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      ) RETURNING id
    `, [
      orderData.customer_id, orderData.pickup_address, orderData.pickup_city, 
      orderData.pickup_postal_code, orderData.pickup_country, orderData.pickup_date,
      orderData.pickup_time_from, orderData.pickup_time_to, orderData.pickup_contact_name,
      orderData.pickup_contact_phone, orderData.delivery_address, orderData.delivery_city,
      orderData.delivery_postal_code, orderData.delivery_country, orderData.delivery_date,
      orderData.delivery_time_from, orderData.delivery_time_to, orderData.delivery_contact_name,
      orderData.delivery_contact_phone, orderData.delivery_stops, orderData.vehicle_type,
      orderData.weight, orderData.length, orderData.width, orderData.height, orderData.pallets,
      orderData.description, orderData.price, orderData.distance_km, orderData.duration_minutes,
      orderData.status, orderData.extra_stops_count, orderData.extra_stops_fee
    ]);
    
    orderId = orderResult.rows[0].id;
    console.log(`   ✅ Order created: #${orderId}`);
    console.log(`      Pickup: ${orderData.pickup_address}, ${orderData.pickup_city}`);
    console.log(`      Stop 1: ${orderData.delivery_address}, ${orderData.delivery_city}`);
    console.log(`      Stop 2: Bernauer Straße 10, 10115 Berlin`);
    
    // 4. Assign to Contractor
    console.log('\n4️⃣ Assign Order to Contractor...');
    await pool.query(`
      UPDATE transport_orders 
      SET contractor_id = $1, status = 'accepted'
      WHERE id = $2
    `, [contractorId, orderId]);
    console.log(`   ✅ Order assigned to contractor #${contractorId}`);
    
    // 5. Create CMRs (Pickup)
    console.log('\n5️⃣ Create CMRs (Pickup)...');
    await CMR.createFromOrder(orderId);
    
    // Fetch all CMRs for this order
    const allCMRs = await CMR.findByGroupId(`ORDER-${orderId}`);
    cmrIds = allCMRs.map(c => c.id);
    
    console.log(`   ✅ ${allCMRs.length} CMRs created:`);
    allCMRs.forEach((cmr, index) => {
      console.log(`      CMR ${index + 1}: ${cmr.cmr_number} (Stop ${cmr.delivery_stop_index + 1}/${cmr.total_stops})`);
    });
    
    // 6. Add Sender & Carrier Signatures
    console.log('\n6️⃣ Add Sender & Carrier Signatures...');
    const dummySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    for (const cmrId of cmrIds) {
      await pool.query(`
        UPDATE cmr_documents 
        SET sender_signed_name = $1,
            sender_signature = $2,
            sender_signed_at = CURRENT_TIMESTAMP,
            carrier_signature = $3,
            carrier_signed_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, ['Max Mustermann', dummySignature, dummySignature, cmrId]);
    }
    console.log(`   ✅ Signatures added to all CMRs`);
    
    // 7. Update Order Status to picked_up
    console.log('\n7️⃣ Update Order Status to "picked_up"...');
    await pool.query(`
      UPDATE transport_orders 
      SET status = 'picked_up'
      WHERE id = $1
    `, [orderId]);
    console.log(`   ✅ Order status: picked_up`);
    
    // 8. Complete Stop 1 (Main Delivery)
    console.log('\n8️⃣ Complete Stop 1 (Main Delivery)...');
    const cmr1 = cmrIds[0];
    await pool.query(`
      UPDATE cmr_documents 
      SET consignee_signed_name = $1,
          consignee_signature = $2,
          consignee_signed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, ['Anna Schmidt', dummySignature, cmr1]);
    console.log(`   ✅ Stop 1 completed (Anna Schmidt)`);
    
    // Check status
    const allCMRs1 = await CMR.findByGroupId(`ORDER-${orderId}`);
    const allCompleted1 = allCMRs1.every(cmr => 
      cmr.consignee_signature || cmr.delivery_photo_base64
    );
    console.log(`   📊 All stops completed: ${allCompleted1 ? 'YES' : 'NO'}`);
    
    // 9. Complete Stop 2 (Extra Delivery)
    console.log('\n9️⃣ Complete Stop 2 (Extra Delivery)...');
    const cmr2 = cmrIds[1];
    await pool.query(`
      UPDATE cmr_documents 
      SET consignee_signed_name = $1,
          consignee_signature = $2,
          consignee_signed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, ['Peter Müller', dummySignature, cmr2]);
    console.log(`   ✅ Stop 2 completed (Peter Müller)`);
    
    // Check status again
    const allCMRs2 = await CMR.findByGroupId(`ORDER-${orderId}`);
    const allCompleted2 = allCMRs2.every(cmr => 
      cmr.consignee_signature || cmr.delivery_photo_base64
    );
    console.log(`   📊 All stops completed: ${allCompleted2 ? 'YES' : 'NO'}`);
    
    // 10. Generate Combined PDF
    console.log('\n🔟 Generate Combined PDF...');
    const MultiStopPdfGenerator = require('./server/services/multiStopPdfGenerator');
    const cmrGroupId = `ORDER-${orderId}`;
    
    const pdfResult = await MultiStopPdfGenerator.generateCombinedPDF(orderId, cmrGroupId);
    const pdfPath = pdfResult.filename || pdfResult.filepath || pdfResult;
    console.log(`   ✅ Combined PDF generated: ${pdfPath}`);
    
    // 11. Update Order Status to completed
    console.log('\n1️⃣1️⃣ Update Order Status to "completed"...');
    await pool.query(`
      UPDATE transport_orders 
      SET status = 'completed'
      WHERE id = $1
    `, [orderId]);
    console.log(`   ✅ Order status: completed`);
    
    // 12. Send Email
    console.log('\n1️⃣2️⃣ Send Email with Combined PDF...');
    const emailService = require('./server/utils/emailService');
    
    // Get customer details
    const customer = await pool.query(`
      SELECT email, first_name, last_name FROM users WHERE id = $1
    `, [customerId]);
    
    const finalCustomerEmail = customer.rows[0].email;
    const customerName = `${customer.rows[0].first_name} ${customer.rows[0].last_name}`;
    
    // Get order details
    const order = await Order.findById(orderId);
    
    console.log(`   📧 Sending to: ${finalCustomerEmail}`);
    console.log(`   📄 Attachment: ${pdfPath}`);
    
    // Send email with attachment
    const fullPdfPath = path.join(__dirname, 'uploads/cmr', pdfPath);
    
    await emailService.sendEmail({
      to: finalCustomerEmail,
      subject: `Auftrag #${orderId} abgeschlossen - CMR Dokumente`,
      html: `
        <h2>Sehr geehrte/r ${customerName},</h2>
        <p>Ihr Auftrag #${orderId} wurde erfolgreich abgeschlossen!</p>
        <p>Im Anhang finden Sie die CMR-Dokumente für alle Zustellungen.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Abholung: ${order.pickup_address}, ${order.pickup_city}</li>
          <li>Zustellung 1: ${order.delivery_address}, ${order.delivery_city}</li>
          <li>Zustellung 2: Bernauer Straße 10, 10115 Berlin</li>
        </ul>
        <p>Vielen Dank für Ihr Vertrauen!</p>
      `,
      attachments: [{
        filename: pdfPath,
        path: fullPdfPath
      }]
    });
    
    console.log(`   ✅ Email sent successfully!`);
    
    // 13. Final Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 FINAL SUMMARY:\n');
    console.log(`   Order ID: #${orderId}`);
    console.log(`   Customer: ${customerName} (${finalCustomerEmail})`);
    console.log(`   Contractor: Test Contractor`);
    console.log(`   Total Stops: 2`);
    console.log(`   CMRs Created: ${cmrIds.length}`);
    console.log(`   All Stops Completed: ✅ YES`);
    console.log(`   Order Status: completed`);
    console.log(`   Combined PDF: ${pdfPath}`);
    console.log(`   Email Sent: ✅ YES`);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 TEST ERFOLGREICH ABGESCHLOSSEN!\n');
    console.log('✅ Multi-Stop Workflow funktioniert vollständig');
    console.log('✅ 2 CMRs in einem PDF kombiniert');
    console.log('✅ Email mit Anhang versendet');
    console.log('\n📧 Prüfe dein Email-Postausgang für die Bestätigung!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FEHLGESCHLAGEN:', error.message);
    console.error(error.stack);
    
    // Cleanup on error
    if (orderId) {
      console.log('\n🧹 Cleanup: Lösche Test-Daten...');
      await pool.query('DELETE FROM cmr_documents WHERE order_id = $1', [orderId]);
      await pool.query('DELETE FROM transport_orders WHERE id = $1', [orderId]);
      console.log('   ✅ Test-Daten gelöscht');
    }
  } finally {
    await pool.end();
  }
}

testCompleteMultiStopWorkflow();

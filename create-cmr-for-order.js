const { Pool } = require('pg');

// Railway Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createCMRForOrder(orderId) {
  const client = await pool.connect();
  
  try {
    console.log(`🔄 Erstelle CMR für Auftrag #${orderId}...\n`);
    
    // Get order details
    const orderResult = await client.query('SELECT * FROM transport_orders WHERE id = $1', [orderId]);
    
    if (orderResult.rows.length === 0) {
      throw new Error(`Auftrag #${orderId} nicht gefunden`);
    }
    
    const order = orderResult.rows[0];
    console.log(`✅ Auftrag gefunden: ${order.pickup_city} → ${order.delivery_city}`);
    
    // Get contractor details
    const contractorResult = await client.query('SELECT * FROM users WHERE id = $1', [order.contractor_id]);
    const contractor = contractorResult.rows[0];
    console.log(`✅ Auftragnehmer: ${contractor.company_name || contractor.first_name + ' ' + contractor.last_name}`);
    
    // Generate CMR number
    const cmrNumberResult = await client.query('SELECT generate_cmr_number() as cmr_number');
    const cmr_number = cmrNumberResult.rows[0].cmr_number;
    console.log(`✅ CMR-Nummer generiert: ${cmr_number}`);
    
    // Create CMR document
    const cmrResult = await client.query(`
      INSERT INTO cmr_documents (
        order_id, cmr_number,
        sender_name, sender_address, sender_city, sender_postal_code, sender_country,
        consignee_name, consignee_address, consignee_city, consignee_postal_code, consignee_country,
        carrier_name, carrier_address, carrier_city, carrier_postal_code,
        place_of_loading, place_of_delivery, documents_attached,
        goods_description, number_of_packages, method_of_packing, marks_and_numbers,
        gross_weight, volume, special_agreements,
        carriage_charges_paid, carriage_charges_forward, cash_on_delivery,
        status
      ) VALUES (
        $1, $2,
        $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26,
        $27, $28, $29,
        'created'
      ) RETURNING *
    `, [
      orderId, cmr_number,
      // Sender (from pickup)
      order.pickup_contact_name || 'Absender',
      order.pickup_address,
      order.pickup_city,
      order.pickup_postal_code,
      order.pickup_country || 'Deutschland',
      // Consignee (from delivery)
      order.delivery_contact_name || 'Empfänger',
      order.delivery_address,
      order.delivery_city,
      order.delivery_postal_code,
      order.delivery_country || 'Deutschland',
      // Carrier (contractor)
      contractor.company_name || `${contractor.first_name} ${contractor.last_name}`,
      '', // carrier_address
      '', // carrier_city
      '', // carrier_postal_code
      // Shipment details
      `${order.pickup_city}, ${order.pickup_country || 'Deutschland'}`,
      `${order.delivery_city}, ${order.delivery_country || 'Deutschland'}`,
      'Lieferschein',
      // Goods
      order.description || 'Allgemeine Fracht',
      order.pallets || 1,
      order.pallets ? `${order.pallets} Palette(n)` : 'Paket',
      `Auftrag #${orderId}`,
      order.weight,
      order.length && order.width && order.height 
        ? (order.length * order.width * order.height / 1000000).toFixed(2)
        : null,
      order.special_requirements || 'Keine besonderen Vereinbarungen',
      true, // carriage_charges_paid
      false, // carriage_charges_forward
      null // cash_on_delivery
    ]);
    
    const cmr = cmrResult.rows[0];
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CMR ERFOLGREICH ERSTELLT!');
    console.log('='.repeat(60));
    console.log(`📋 CMR-Nummer: ${cmr.cmr_number}`);
    console.log(`📦 Auftrag: #${orderId}`);
    console.log(`🚚 Route: ${order.pickup_city} → ${order.delivery_city}`);
    console.log(`📄 Status: ${cmr.status}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('✅ Sie können jetzt den Auftrag ausführen!');
    console.log('   1. Klicken Sie auf "CMR anzeigen"');
    console.log('   2. Status ändern: Abgeholt → Zugestellt');
    console.log('   3. Unterschrift/Foto sammeln\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get order ID from command line or use default
const orderId = process.argv[2] || '2';

createCMRForOrder(orderId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

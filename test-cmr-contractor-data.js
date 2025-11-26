const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testCMRContractorData() {
  try {
    console.log('🔍 Testing CMR Contractor Data (Feld 16)...\n');
    
    // Get a completed order with CMR
    const orderResult = await pool.query(`
      SELECT 
        o.id as order_id,
        o.contractor_id,
        u.company_name,
        u.company_address,
        u.company_city,
        u.company_postal_code,
        u.first_name,
        u.last_name
      FROM transport_orders o
      LEFT JOIN users u ON o.contractor_id = u.id
      WHERE o.status = 'completed' 
        AND o.contractor_id IS NOT NULL
      ORDER BY o.completed_at DESC
      LIMIT 1
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ No completed orders with contractor found');
      await pool.end();
      return;
    }
    
    const order = orderResult.rows[0];
    console.log('📦 Order #' + order.order_id);
    console.log('   Contractor ID:', order.contractor_id);
    console.log('\n👤 Contractor Data:');
    console.log('   Company Name:', order.company_name || '(not set)');
    console.log('   Company Address:', order.company_address || '(not set)');
    console.log('   Company City:', order.company_city || '(not set)');
    console.log('   Company Postal Code:', order.company_postal_code || '(not set)');
    console.log('   Fallback Name:', `${order.first_name} ${order.last_name}`);
    
    // Get CMR for this order
    const cmrResult = await pool.query(`
      SELECT 
        id,
        cmr_number,
        carrier_name,
        carrier_address,
        carrier_city,
        carrier_postal_code
      FROM cmr_documents
      WHERE order_id = $1
    `, [order.order_id]);
    
    if (cmrResult.rows.length === 0) {
      console.log('\n❌ No CMR found for this order');
      await pool.end();
      return;
    }
    
    const cmr = cmrResult.rows[0];
    console.log('\n📄 CMR Document:');
    console.log('   CMR Number:', cmr.cmr_number);
    console.log('\n📋 Feld 16 (Transportunternehmer):');
    console.log('   Carrier Name:', cmr.carrier_name);
    console.log('   Carrier Address:', cmr.carrier_address || '(empty)');
    console.log('   Carrier City:', cmr.carrier_city || '(empty)');
    console.log('   Carrier Postal Code:', cmr.carrier_postal_code || '(empty)');
    
    // Check if data matches
    console.log('\n✅ Verification:');
    const nameMatches = cmr.carrier_name === (order.company_name || `${order.first_name} ${order.last_name}`);
    const addressMatches = cmr.carrier_address === (order.company_address || '');
    const cityMatches = cmr.carrier_city === (order.company_city || '');
    const postalMatches = cmr.carrier_postal_code === (order.company_postal_code || '');
    
    console.log('   Name matches:', nameMatches ? '✅' : '❌');
    console.log('   Address matches:', addressMatches ? '✅' : '❌');
    console.log('   City matches:', cityMatches ? '✅' : '❌');
    console.log('   Postal Code matches:', postalMatches ? '✅' : '❌');
    
    if (nameMatches && addressMatches && cityMatches && postalMatches) {
      console.log('\n✅ CMR Feld 16 shows correct contractor data!');
    } else {
      console.log('\n⚠️  CMR data does not match contractor profile!');
      console.log('   This might be because the CMR was created before the company data was added.');
      console.log('   New CMRs will use the updated company data.');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testCMRContractorData();

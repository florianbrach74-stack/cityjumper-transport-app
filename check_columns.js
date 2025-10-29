const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('distance_km', 'duration_minutes', 'route_geometry')
      ORDER BY column_name;
    `);
    
    console.log('Columns in transport_orders:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    if (result.rows.length < 3) {
      console.log('\n⚠️ Missing route_geometry column! Running migration...');
      const sql = `
        ALTER TABLE transport_orders
        ADD COLUMN IF NOT EXISTS route_geometry TEXT;
      `;
      await pool.query(sql);
      console.log('✅ route_geometry column added!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();

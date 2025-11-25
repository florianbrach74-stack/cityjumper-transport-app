const pool = require('./config/database');

async function createTable() {
  console.log('🔄 Creating email_templates table...\n');
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        template_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50) NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        variables TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelle email_templates erstellt!');
    
    // Check if table has data
    const result = await pool.query('SELECT COUNT(*) FROM email_templates');
    console.log(`📊 Aktuelle Templates: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
  
  await pool.end();
}

createTable();

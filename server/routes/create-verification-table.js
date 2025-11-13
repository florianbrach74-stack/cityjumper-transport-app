const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Create verification_documents table (Admin only, one-time use)
router.post('/create-verification-table', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating verification_documents table...');
    
    await client.query('BEGIN');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by INTEGER REFERENCES users(id),
        is_current BOOLEAN DEFAULT TRUE,
        replaced_by INTEGER REFERENCES verification_documents(id),
        notes TEXT
      );
    `);
    console.log('✅ Table created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_documents_user_id 
      ON verification_documents(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_documents_type 
      ON verification_documents(document_type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_documents_current 
      ON verification_documents(is_current);
    `);
    console.log('✅ Indexes created');
    
    await client.query('COMMIT');
    
    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = 'verification_documents'
    `);
    
    const columnCount = parseInt(result.rows[0].column_count);
    
    res.json({
      success: true,
      message: 'verification_documents table created successfully!',
      columnCount,
      expectedColumns: 12,
      allGood: columnCount === 12
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating table:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Table may already exist - check Railway dashboard'
    });
  } finally {
    client.release();
  }
});

module.exports = router;

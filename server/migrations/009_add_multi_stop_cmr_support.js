const pool = require('../config/database');

async function up() {
  console.log('🚀 Running migration: Add Multi-Stop CMR Support');
  
  // Add columns for multi-stop CMR support
  await pool.query(`
    ALTER TABLE cmr_documents
    ADD COLUMN IF NOT EXISTS cmr_group_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS delivery_stop_index INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_stops INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_multi_stop BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_share_sender_signature BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS can_share_receiver_signature BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS shared_sender_signature TEXT,
    ADD COLUMN IF NOT EXISTS shared_carrier_signature TEXT,
    ADD COLUMN IF NOT EXISTS shared_receiver_signature TEXT,
    ADD COLUMN IF NOT EXISTS delivery_photo_base64 TEXT,
    ADD COLUMN IF NOT EXISTS shared_delivery_photo_base64 TEXT;
  `);
  
  // Create index for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_cmr_group_id 
    ON cmr_documents(cmr_group_id);
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_cmr_order_stop 
    ON cmr_documents(order_id, delivery_stop_index);
  `);
  
  // Update existing CMRs to have default values
  await pool.query(`
    UPDATE cmr_documents 
    SET cmr_group_id = CONCAT('ORDER-', order_id),
        delivery_stop_index = 0,
        total_stops = 1,
        is_multi_stop = false
    WHERE cmr_group_id IS NULL;
  `);
  
  console.log('✅ Migration completed: Multi-Stop CMR Support added');
}

async function down() {
  console.log('🔄 Rolling back migration: Remove Multi-Stop CMR Support');
  
  await pool.query(`
    DROP INDEX IF EXISTS idx_cmr_group_id;
    DROP INDEX IF EXISTS idx_cmr_order_stop;
  `);
  
  await pool.query(`
    ALTER TABLE cmr_documents
    DROP COLUMN IF EXISTS cmr_group_id,
    DROP COLUMN IF EXISTS delivery_stop_index,
    DROP COLUMN IF EXISTS total_stops,
    DROP COLUMN IF EXISTS is_multi_stop,
    DROP COLUMN IF EXISTS can_share_sender_signature,
    DROP COLUMN IF EXISTS can_share_receiver_signature,
    DROP COLUMN IF EXISTS shared_sender_signature,
    DROP COLUMN IF EXISTS shared_carrier_signature,
    DROP COLUMN IF EXISTS shared_receiver_signature,
    DROP COLUMN IF EXISTS delivery_photo_base64,
    DROP COLUMN IF EXISTS shared_delivery_photo_base64;
  `);
  
  console.log('✅ Rollback completed: Multi-Stop CMR Support removed');
}

module.exports = { up, down };

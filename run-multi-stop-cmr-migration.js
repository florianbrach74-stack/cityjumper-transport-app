const { up } = require('./server/migrations/009_add_multi_stop_cmr_support');

async function runMigration() {
  try {
    console.log('🚀 Running Multi-Stop CMR migration...\n');
    await up();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

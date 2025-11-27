const { up } = require('./server/migrations/008_create_saved_routes');

async function runMigration() {
  try {
    console.log('🚀 Running saved_routes migration...\n');
    await up();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

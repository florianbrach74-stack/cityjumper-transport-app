const { Client } = require('pg');

// Railway PostgreSQL (Source) - Use public URL
const railwayClient = new Client({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnYFSG@ballast.proxy.rlwy.net:10003/railway'
});

// Supabase PostgreSQL (Destination) - Session Pooler
const supabaseClient = new Client({
  connectionString: 'postgresql://postgres.stsltzmqs1yguchddi:kobrog-coRnu5-dosfyk@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function migrate() {
  try {
    console.log('🔌 Connecting to Railway...');
    await railwayClient.connect();
    console.log('✅ Connected to Railway');

    console.log('🔌 Connecting to Supabase...');
    await supabaseClient.connect();
    console.log('✅ Connected to Supabase');

    // Get all table names
    console.log('\n📋 Getting table list...');
    const tablesResult = await railwayClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`Found ${tables.length} tables:`, tables);

    // Export schema
    console.log('\n📦 Exporting schema...');
    const schemaResult = await railwayClient.query(`
      SELECT 
        'CREATE TABLE ' || tablename || ' (' ||
        array_to_string(
          array_agg(
            column_name || ' ' || data_type ||
            CASE WHEN character_maximum_length IS NOT NULL 
              THEN '(' || character_maximum_length || ')' 
              ELSE '' 
            END
          ), ', '
        ) || ');' as create_statement
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY tablename;
    `);

    // Create tables in Supabase
    console.log('\n🏗️  Creating tables in Supabase...');
    for (const row of schemaResult.rows) {
      try {
        await supabaseClient.query(row.create_statement);
        console.log(`✅ Created table from schema`);
      } catch (error) {
        console.log(`⚠️  Table might already exist: ${error.message}`);
      }
    }

    // Copy data for each table
    console.log('\n📊 Copying data...');
    for (const table of tables) {
      console.log(`\n📋 Processing table: ${table}`);
      
      // Get data from Railway
      const dataResult = await railwayClient.query(`SELECT * FROM ${table}`);
      console.log(`  Found ${dataResult.rows.length} rows`);

      if (dataResult.rows.length === 0) {
        console.log(`  ⏭️  Skipping empty table`);
        continue;
      }

      // Get column names
      const columns = Object.keys(dataResult.rows[0]);
      
      // Insert data into Supabase
      let inserted = 0;
      for (const row of dataResult.rows) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        try {
          await supabaseClient.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
          inserted++;
        } catch (error) {
          console.error(`  ❌ Error inserting row:`, error.message);
        }
      }
      
      console.log(`  ✅ Inserted ${inserted}/${dataResult.rows.length} rows`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update Railway Backend DATABASE_URL to Supabase connection string');
    console.log('2. Redeploy backend');
    console.log('3. Test the application');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await railwayClient.end();
    await supabaseClient.end();
  }
}

migrate();

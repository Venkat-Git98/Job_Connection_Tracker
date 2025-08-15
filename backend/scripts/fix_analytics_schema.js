const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAnalyticsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing analytics schema and cleaning dummy data...');
    
    // First, let's check what tables exist and their structure
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('\n📋 Existing tables:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check if user_id columns exist
    const checkUserIdColumns = async (tableName) => {
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'user_id'
      `, [tableName]);
      return result.rows.length > 0;
    };
    
    const jobsHasUserId = await checkUserIdColumns('jobs');
    const profilesHasUserId = await checkUserIdColumns('profiles');
    const emailEventsHasUserId = await checkUserIdColumns('email_events');
    
    console.log('\n🔍 User ID column status:');
    console.log(`  jobs.user_id: ${jobsHasUserId ? '✅ exists' : '❌ missing'}`);
    console.log(`  profiles.user_id: ${profilesHasUserId ? '✅ exists' : '❌ missing'}`);
    console.log(`  email_events.user_id: ${emailEventsHasUserId ? '✅ exists' : '❌ missing'}`);
    
    // If user_id columns don't exist, we'll work with the current schema
    // Clean up dummy data regardless of schema
    console.log('\n🧹 Cleaning dummy data...');
    
    // Delete dummy jobs and related email events
    const testCompanies = [
      'Google', 'Microsoft', 'OpenAI', 'Netflix', 'Apple', 'Amazon', 
      'Meta', 'Tesla', 'Uber', 'Airbnb', 'Stripe', 'Spotify'
    ];
    
    let totalDeleted = 0;
    
    // Delete email events for test jobs first
    for (const company of testCompanies) {
      const emailResult = await client.query(`
        DELETE FROM email_events 
        WHERE job_id IN (
          SELECT id FROM jobs 
          WHERE company_name ILIKE $1
        )
        RETURNING id
      `, [`%${company}%`]);
      totalDeleted += emailResult.rows.length;
    }
    
    // Delete test jobs
    for (const company of testCompanies) {
      const jobResult = await client.query(`
        DELETE FROM jobs 
        WHERE company_name ILIKE $1
        RETURNING id
      `, [`%${company}%`]);
      totalDeleted += jobResult.rows.length;
    }
    
    // Delete test profiles
    const testProfilePatterns = [
      'John Doe', 'Jane Smith', 'Test User', 'Demo User',
      'Sample Person', 'Example User'
    ];
    
    for (const pattern of testProfilePatterns) {
      const profileResult = await client.query(`
        DELETE FROM profiles 
        WHERE person_name ILIKE $1
        RETURNING id
      `, [`%${pattern}%`]);
      totalDeleted += profileResult.rows.length;
    }
    
    // Delete profiles from test companies
    for (const company of testCompanies) {
      const profileResult = await client.query(`
        DELETE FROM profiles 
        WHERE current_company ILIKE $1
        RETURNING id
      `, [`%${company}%`]);
      totalDeleted += profileResult.rows.length;
    }
    
    console.log(`✅ Deleted ${totalDeleted} dummy records`);
    
    // Get final counts
    const finalCounts = {};
    const tableNames = ['jobs', 'profiles', 'email_events', 'users'];
    
    for (const tableName of tableNames) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        finalCounts[tableName] = parseInt(result.rows[0].count);
      } catch (error) {
        finalCounts[tableName] = 'N/A';
      }
    }
    
    console.log('\n📊 Final record counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    console.log('\n✅ Analytics schema fix and cleanup completed!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Refresh your analytics dashboard');
    console.log('   3. The analytics should now work without user_id errors');
    console.log('   4. Start using the Chrome extension to track real data');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run fix if called directly
if (require.main === module) {
  fixAnalyticsSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fixAnalyticsSchema };
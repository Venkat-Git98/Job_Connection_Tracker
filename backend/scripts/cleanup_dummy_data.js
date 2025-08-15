const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanupDummyData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting dummy data cleanup...');
    
    // Get counts before cleanup
    const beforeCounts = await getTableCounts(client);
    console.log('\n📊 Records before cleanup:');
    Object.entries(beforeCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    // Identify and delete dummy/test data
    console.log('\n🔍 Identifying and removing dummy data...');
    
    // 1. Delete jobs from known test companies or with test URLs
    const testCompanies = [
      'Google', 'Microsoft', 'OpenAI', 'Netflix', 'Apple', 'Amazon', 
      'Meta', 'Tesla', 'Uber', 'Airbnb', 'Stripe', 'Spotify'
    ];
    
    const testUrlPatterns = [
      'linkedin.com/jobs/google-swe',
      'indeed.com/microsoft-fullstack',
      'openai.greenhouse.io',
      'netflix.lever.co',
      'example.com',
      'test.com',
      'dummy.com'
    ];
    
    // Delete email events for test jobs first
    let deletedEmailEvents = 0;
    for (const company of testCompanies) {
      const result = await client.query(`
        DELETE FROM email_events 
        WHERE job_id IN (
          SELECT id FROM jobs 
          WHERE company_name ILIKE $1
        )
        RETURNING id
      `, [`%${company}%`]);
      deletedEmailEvents += result.rows.length;
    }
    
    // Delete test jobs
    let deletedJobs = 0;
    for (const company of testCompanies) {
      const result = await client.query(`
        DELETE FROM jobs 
        WHERE company_name ILIKE $1
        RETURNING id
      `, [`%${company}%`]);
      deletedJobs += result.rows.length;
    }
    
    // Delete jobs with test URLs
    for (const urlPattern of testUrlPatterns) {
      const result = await client.query(`
        DELETE FROM jobs 
        WHERE job_url ILIKE $1
        RETURNING id
      `, [`%${urlPattern}%`]);
      deletedJobs += result.rows.length;
    }
    
    console.log(`  ✅ Deleted ${deletedEmailEvents} email events from test jobs`);
    console.log(`  ✅ Deleted ${deletedJobs} test jobs`);
    
    // 2. Delete test profiles/connections
    const testProfilePatterns = [
      'John Doe', 'Jane Smith', 'Test User', 'Demo User',
      'Sample Person', 'Example User'
    ];
    
    let deletedProfiles = 0;
    for (const pattern of testProfilePatterns) {
      const result = await client.query(`
        DELETE FROM profiles 
        WHERE person_name ILIKE $1
        RETURNING id
      `, [`%${pattern}%`]);
      deletedProfiles += result.rows.length;
    }
    
    // Delete profiles from test companies
    for (const company of testCompanies) {
      const result = await client.query(`
        DELETE FROM profiles 
        WHERE current_company ILIKE $1
        RETURNING id
      `, [`%${company}%`]);
      deletedProfiles += result.rows.length;
    }
    
    console.log(`  ✅ Deleted ${deletedProfiles} test profiles/connections`);
    
    // 3. Delete old test data (older than 30 days with specific patterns)
    const oldTestJobsResult = await client.query(`
      DELETE FROM jobs 
      WHERE created_at < NOW() - INTERVAL '30 days'
      AND (
        job_title ILIKE '%test%' OR 
        job_title ILIKE '%sample%' OR 
        job_title ILIKE '%demo%' OR
        company_name ILIKE '%test%' OR
        company_name ILIKE '%sample%' OR
        company_name ILIKE '%demo%'
      )
      RETURNING id
    `);
    
    const oldTestProfilesResult = await client.query(`
      DELETE FROM profiles 
      WHERE created_at < NOW() - INTERVAL '30 days'
      AND (
        person_name ILIKE '%test%' OR 
        person_name ILIKE '%sample%' OR 
        person_name ILIKE '%demo%' OR
        current_company ILIKE '%test%' OR
        current_company ILIKE '%sample%' OR
        current_company ILIKE '%demo%'
      )
      RETURNING id
    `);
    
    console.log(`  ✅ Deleted ${oldTestJobsResult.rows.length} old test jobs`);
    console.log(`  ✅ Deleted ${oldTestProfilesResult.rows.length} old test profiles`);
    
    // Get counts after cleanup
    const afterCounts = await getTableCounts(client);
    console.log('\n📊 Records after cleanup:');
    Object.entries(afterCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    const totalDeleted = deletedEmailEvents + deletedJobs + deletedProfiles + 
                        oldTestJobsResult.rows.length + oldTestProfilesResult.rows.length;
    
    console.log(`\n✅ Dummy data cleanup completed! Removed ${totalDeleted} test records.`);
    console.log('   Your real data has been preserved.');
    
  } catch (error) {
    console.error('❌ Dummy data cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function getTableCounts(client) {
  const tables = ['email_events', 'jobs', 'profiles', 'users'];
  const counts = {};
  
  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
    } catch (error) {
      counts[table] = 'N/A';
    }
  }
  
  return counts;
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupDummyData()
    .then(() => {
      console.log('\n🎯 Next steps:');
      console.log('   1. Refresh your analytics dashboard');
      console.log('   2. Start using the Chrome extension to track real jobs');
      console.log('   3. Your analytics will now show only real data');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { cleanupDummyData };
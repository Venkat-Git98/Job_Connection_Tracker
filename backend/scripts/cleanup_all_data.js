const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanupAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting comprehensive database cleanup...');
    
    // Get counts before cleanup
    const beforeCounts = await getTableCounts(client);
    console.log('\n📊 Records before cleanup:');
    Object.entries(beforeCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    // Delete all data in the correct order (respecting foreign key constraints)
    console.log('\n🗑️ Deleting all records...');
    
    // 1. Delete email events first (references jobs)
    const emailEventsResult = await client.query('DELETE FROM email_events RETURNING id');
    console.log(`  ✅ Deleted ${emailEventsResult.rows.length} email events`);
    
    // 2. Delete jobs
    const jobsResult = await client.query('DELETE FROM jobs RETURNING id');
    console.log(`  ✅ Deleted ${jobsResult.rows.length} jobs`);
    
    // 3. Delete profiles (connections)
    const profilesResult = await client.query('DELETE FROM profiles RETURNING id');
    console.log(`  ✅ Deleted ${profilesResult.rows.length} profiles/connections`);
    
    // 4. Delete users (but keep the current user if exists)
    const usersResult = await client.query(`
      DELETE FROM users 
      WHERE username != 'venkat' 
      RETURNING id, username
    `);
    console.log(`  ✅ Deleted ${usersResult.rows.length} users (kept 'venkat' if exists)`);
    
    // Reset auto-increment sequences
    console.log('\n🔄 Resetting auto-increment sequences...');
    const sequences = [
      'email_events_id_seq',
      'jobs_id_seq', 
      'profiles_id_seq',
      'users_id_seq'
    ];
    
    for (const sequence of sequences) {
      try {
        await client.query(`ALTER SEQUENCE ${sequence} RESTART WITH 1`);
        console.log(`  ✅ Reset ${sequence}`);
      } catch (error) {
        console.log(`  ⚠️ Could not reset ${sequence} (might not exist)`);
      }
    }
    
    // Get counts after cleanup
    const afterCounts = await getTableCounts(client);
    console.log('\n📊 Records after cleanup:');
    Object.entries(afterCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\n🎯 Your database is now clean and ready for fresh data.');
    console.log('   You can start using the Chrome extension to track new jobs and connections.');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
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

// Add option to keep specific user data
async function cleanupAllDataExceptUser(userId = null) {
  const client = await pool.connect();
  
  try {
    console.log(`🧹 Starting cleanup (preserving user ${userId} data)...`);
    
    if (userId) {
      // Delete data for all users except the specified one
      await client.query('DELETE FROM email_events WHERE job_id IN (SELECT id FROM jobs WHERE user_id != $1)', [userId]);
      await client.query('DELETE FROM jobs WHERE user_id != $1', [userId]);
      await client.query('DELETE FROM profiles WHERE user_id != $1', [userId]);
      await client.query('DELETE FROM users WHERE id != $1', [userId]);
      
      console.log(`✅ Cleaned up all data except for user ${userId}`);
    } else {
      // Clean everything
      await cleanupAllData();
    }
    
  } catch (error) {
    console.error('❌ Selective cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const keepUser = args.includes('--keep-user');
  const userId = args.find(arg => arg.startsWith('--user-id='))?.split('=')[1];
  
  if (keepUser && userId) {
    cleanupAllDataExceptUser(parseInt(userId))
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    cleanupAllData()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = { cleanupAllData, cleanupAllDataExceptUser };
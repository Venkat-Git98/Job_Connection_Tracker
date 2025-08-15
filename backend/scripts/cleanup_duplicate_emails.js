const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanupDuplicateEmails() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting duplicate email cleanup...');
    
    // Find duplicate emails based on subject, sender, and similar timestamps
    const findDuplicatesQuery = `
      WITH duplicates AS (
        SELECT 
          id,
          email_subject,
          email_from,
          processed_at,
          ROW_NUMBER() OVER (
            PARTITION BY email_subject, email_from, DATE_TRUNC('hour', processed_at)
            ORDER BY processed_at ASC
          ) as row_num
        FROM email_events
      )
      SELECT id FROM duplicates WHERE row_num > 1;
    `;
    
    const duplicates = await client.query(findDuplicatesQuery);
    
    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicate emails found');
      return;
    }
    
    console.log(`📧 Found ${duplicates.rows.length} duplicate email entries`);
    
    // Delete duplicates, keeping only the first occurrence
    const duplicateIds = duplicates.rows.map(row => row.id);
    const deleteQuery = `
      DELETE FROM email_events 
      WHERE id = ANY($1::int[])
    `;
    
    const result = await client.query(deleteQuery, [duplicateIds]);
    
    console.log(`🗑️ Deleted ${result.rowCount} duplicate email entries`);
    
    // Show remaining email count
    const countQuery = 'SELECT COUNT(*) as total FROM email_events';
    const countResult = await client.query(countQuery);
    
    console.log(`📊 Remaining email events: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupDuplicateEmails()
    .then(() => {
      console.log('✅ Duplicate email cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Duplicate email cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateEmails };
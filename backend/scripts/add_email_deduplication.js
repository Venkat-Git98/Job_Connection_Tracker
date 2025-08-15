const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const deduplicationMigrations = [
  `
  -- Add email_message_id column for better deduplication
  ALTER TABLE email_events 
  ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(255);
  `,
  `
  -- Add index for faster duplicate checking
  CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON email_events(email_message_id);
  CREATE INDEX IF NOT EXISTS idx_email_events_dedup ON email_events(email_subject, email_from, processed_at);
  `,
  `
  -- Add unique constraint to prevent exact duplicates
  ALTER TABLE email_events 
  ADD CONSTRAINT IF NOT EXISTS unique_email_message 
  UNIQUE (email_message_id) 
  DEFERRABLE INITIALLY DEFERRED;
  `
];

async function runDeduplicationMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Running email deduplication migrations...');
    
    for (let i = 0; i < deduplicationMigrations.length; i++) {
      console.log(`Running deduplication migration ${i + 1}/${deduplicationMigrations.length}`);
      try {
        await client.query(deduplicationMigrations[i]);
      } catch (error) {
        // Some migrations might fail if constraints already exist, that's okay
        if (!error.message.includes('already exists')) {
          console.warn(`Migration ${i + 1} warning:`, error.message);
        }
      }
    }
    
    console.log('All deduplication migrations completed successfully!');
  } catch (error) {
    console.error('Deduplication migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runDeduplicationMigrations();
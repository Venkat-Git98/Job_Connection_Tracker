const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const emailMigrations = [
  `
  CREATE TABLE IF NOT EXISTS email_events (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    email_type VARCHAR(50) NOT NULL, -- rejection, assessment, interview_invite, offer, update, other
    email_subject TEXT,
    email_from VARCHAR(255),
    email_content TEXT,
    metadata JSONB, -- store confidence, next_steps, deadline, assessment_link, etc.
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS assessment_link TEXT,
  ADD COLUMN IF NOT EXISTS assessment_deadline DATE,
  ADD COLUMN IF NOT EXISTS email_thread_id VARCHAR(255);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_email_events_job_id ON email_events(job_id);
  CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(email_type);
  CREATE INDEX IF NOT EXISTS idx_email_events_processed_at ON email_events(processed_at);
  `
];

async function runEmailMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Running email monitoring migrations...');
    
    for (let i = 0; i < emailMigrations.length; i++) {
      console.log(`Running email migration ${i + 1}/${emailMigrations.length}`);
      await client.query(emailMigrations[i]);
    }
    
    console.log('All email migrations completed successfully!');
  } catch (error) {
    console.error('Email migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runEmailMigrations();
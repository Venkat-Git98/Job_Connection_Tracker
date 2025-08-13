const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const migrations = [
  `
  CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    person_name VARCHAR(255) NOT NULL,
    profile_url VARCHAR(500) UNIQUE NOT NULL,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    location VARCHAR(255),
    headline VARCHAR(500),
    about TEXT,
    experiences JSONB,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    job_url VARCHAR(500) UNIQUE NOT NULL,
    location VARCHAR(255),
    posted_date DATE,
    applied_date DATE,
    application_status VARCHAR(50) DEFAULT 'viewed',
    notes TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE outreach (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES profiles(id),
    platform VARCHAR(50) DEFAULT 'linkedin',
    first_contact_date DATE,
    last_contact_date DATE,
    connection_request_text TEXT,
    connection_status VARCHAR(50) DEFAULT 'none',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES profiles(id),
    job_id INTEGER REFERENCES jobs(id),
    direction VARCHAR(20) CHECK (direction IN ('outbound', 'inbound')),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE INDEX idx_profiles_url ON profiles(profile_url);
  CREATE INDEX idx_jobs_url ON jobs(job_url);
  CREATE INDEX idx_outreach_profile ON outreach(profile_id);
  `
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Running database migrations...');
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}`);
      await client.query(migrations[i]);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
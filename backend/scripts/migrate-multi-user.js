const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const multiUserMigrations = [
  // Step 1: Create users table
  `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true, "ai_personality": {}}'::jsonb
  );
  `,
  
  // Step 2: Create default user if migrating existing data
  `
  INSERT INTO users (username, display_name, preferences) 
  VALUES ('venkat', 'Venkat', '{"theme": "dark", "notifications": true, "ai_personality": {}, "email_access": true}'::jsonb)
  ON CONFLICT (username) DO NOTHING;
  `,
  
  // Step 3: Add user_id columns to existing tables
  `
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
  ALTER TABLE outreach ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
  `,
  
  // Step 4: Populate user_id with default user for existing data
  `
  UPDATE profiles SET user_id = (SELECT id FROM users WHERE username = 'venkat') WHERE user_id IS NULL;
  UPDATE jobs SET user_id = (SELECT id FROM users WHERE username = 'venkat') WHERE user_id IS NULL;
  UPDATE outreach SET user_id = (SELECT id FROM users WHERE username = 'venkat') WHERE user_id IS NULL;
  UPDATE messages SET user_id = (SELECT id FROM users WHERE username = 'venkat') WHERE user_id IS NULL;
  `,
  
  // Step 5: Make user_id NOT NULL and add indexes
  `
  ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
  ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;
  ALTER TABLE outreach ALTER COLUMN user_id SET NOT NULL;
  ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;
  `,
  
  // Step 6: Create indexes for performance
  `
  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
  CREATE INDEX IF NOT EXISTS idx_outreach_user_id ON outreach(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
  `
];

const cleanDatabaseMigrations = [
  // Drop existing tables and recreate with multi-user support
  `
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS outreach CASCADE;
  DROP TABLE IF EXISTS jobs CASCADE;
  DROP TABLE IF EXISTS profiles CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  `,
  
  // Create users table
  `
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true, "ai_personality": {}, "email_access": false}'::jsonb
  );
  `,
  
  // Create profiles table with user_id
  `
  CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL,
    profile_url VARCHAR(500) NOT NULL,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    location VARCHAR(255),
    headline VARCHAR(500),
    about TEXT,
    experiences JSONB,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, profile_url)
  );
  `,
  
  // Create jobs table with user_id
  `
  CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    job_url VARCHAR(500) NOT NULL,
    location VARCHAR(255),
    posted_date DATE,
    applied_date DATE,
    application_status VARCHAR(50) DEFAULT 'viewed',
    notes TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_url)
  );
  `,
  
  // Create outreach table with user_id
  `
  CREATE TABLE outreach (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    platform VARCHAR(50) DEFAULT 'linkedin',
    first_contact_date DATE,
    last_contact_date DATE,
    connection_request_text TEXT,
    connection_status VARCHAR(50) DEFAULT 'none',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Create messages table with user_id
  `
  CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    direction VARCHAR(20) CHECK (direction IN ('outbound', 'inbound')),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Create all indexes
  `
  CREATE INDEX idx_profiles_user_id ON profiles(user_id);
  CREATE INDEX idx_profiles_url ON profiles(profile_url);
  CREATE INDEX idx_jobs_user_id ON jobs(user_id);
  CREATE INDEX idx_jobs_url ON jobs(job_url);
  CREATE INDEX idx_outreach_user_id ON outreach(user_id);
  CREATE INDEX idx_outreach_profile ON outreach(profile_id);
  CREATE INDEX idx_messages_user_id ON messages(user_id);
  CREATE INDEX idx_users_username ON users(username);
  CREATE INDEX idx_users_last_active ON users(last_active_at);
  `
];

async function runMigration(migrateExisting = true) {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting multi-user database migration...');
    console.log(`Migration type: ${migrateExisting ? 'Preserve existing data' : 'Clean database'}`);
    
    const migrations = migrateExisting ? multiUserMigrations : cleanDatabaseMigrations;
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration step ${i + 1}/${migrations.length}`);
      await client.query(migrations[i]);
    }
    
    // Create a default user for clean database
    if (!migrateExisting) {
      console.log('Creating default user for clean database...');
      await client.query(`
        INSERT INTO users (username, display_name, preferences) 
        VALUES ('venkat', 'Venkat', '{"theme": "dark", "notifications": true, "ai_personality": {}, "email_access": true}'::jsonb)
      `);
    }
    
    console.log('✅ Multi-user migration completed successfully!');
    
    // Show migration summary
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const profileCount = await client.query('SELECT COUNT(*) FROM profiles');
    const jobCount = await client.query('SELECT COUNT(*) FROM jobs');
    
    console.log('\n📊 Migration Summary:');
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Profiles: ${profileCount.rows[0].count}`);
    console.log(`Jobs: ${jobCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Command line argument handling
const args = process.argv.slice(2);
const cleanDatabase = args.includes('--clean');

runMigration(!cleanDatabase);
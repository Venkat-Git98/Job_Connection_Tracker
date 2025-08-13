const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Checking database tables...');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:', result.rows.map(r => r.table_name));
    
    // Check profiles table structure
    const profilesResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log('Profiles table columns:', profilesResult.rows);
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
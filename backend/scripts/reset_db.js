const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Dropping existing tables...');
    
    // Drop tables in correct order (foreign keys first)
    const dropQueries = [
      'DROP TABLE IF EXISTS messages CASCADE;',
      'DROP TABLE IF EXISTS outreach CASCADE;',
      'DROP TABLE IF EXISTS jobs CASCADE;',
      'DROP TABLE IF EXISTS profiles CASCADE;',
      'DROP TABLE IF EXISTS applications CASCADE;',
      'DROP TABLE IF EXISTS accounts CASCADE;',
      'DROP TABLE IF EXISTS plans CASCADE;'
    ];
    
    for (const query of dropQueries) {
      await client.query(query);
    }
    
    console.log('All tables dropped successfully!');
    
  } catch (error) {
    console.error('Reset failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
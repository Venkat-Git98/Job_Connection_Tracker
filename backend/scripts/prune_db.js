const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function pruneDatabase() {
  const client = await pool.connect();
  try {
    console.log('Pruning database (truncate all known tables)...');

    // Discover existing public tables to avoid errors when some are missing
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    const existing = new Set(rows.map(r => r.table_name));

    // Known tables used by this app
    const tablesInOrder = [
      'email_events',
      'messages',
      'outreach',
      'jobs',
      'profiles'
    ];

    const toTruncate = tablesInOrder.filter(t => existing.has(t));

    if (toTruncate.length === 0) {
      console.log('No tables to truncate. Schema may not be created yet.');
      return;
    }

    // Build TRUNCATE statement that resets identities and cascades
    const truncateSql = `TRUNCATE ${toTruncate.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
    await client.query(truncateSql);
    console.log('Prune complete. All rows removed and identities reset.');
  } catch (error) {
    console.error('Prune failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

pruneDatabase();



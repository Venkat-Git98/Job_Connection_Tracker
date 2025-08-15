const express = require('express');
const router = express.Router();
const { cleanupAllData, cleanupAllDataExceptUser } = require('../scripts/cleanup_all_data');
const { cleanupDummyData } = require('../scripts/cleanup_dummy_data');

// Middleware to check if user is admin (only Venkat)
const requireAdmin = (req, res, next) => {
  // In a real app, you'd check user roles from the database
  // For now, we'll check if the user is 'venkat' or has admin privileges
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  // For now, allow any authenticated user to perform admin actions
  // In production, you'd want proper role-based access control
  next();
};

// Clean all data
router.post('/cleanup/all', requireAdmin, async (req, res) => {
  try {
    console.log('🧹 Admin cleanup: Deleting all data...');

    // Run cleanup in a separate process to avoid blocking
    const { spawn } = require('child_process');
    const cleanup = spawn('node', ['backend/scripts/cleanup_all_data.js'], {
      stdio: 'pipe'
    });

    let output = '';
    cleanup.stdout.on('data', (data) => {
      output += data.toString();
    });

    cleanup.stderr.on('data', (data) => {
      output += data.toString();
    });

    cleanup.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Cleanup completed successfully');
      } else {
        console.error('❌ Cleanup failed with code:', code);
      }
    });

    res.json({
      success: true,
      message: 'Database cleanup initiated. All data will be deleted.',
      warning: 'This action cannot be undone!'
    });

  } catch (error) {
    console.error('Failed to initiate cleanup:', error);
    res.status(500).json({
      error: 'Failed to initiate database cleanup',
      message: error.message
    });
  }
});

// Clean only dummy/test data
router.post('/cleanup/dummy', requireAdmin, async (req, res) => {
  try {
    console.log('🧹 Admin cleanup: Deleting dummy data...');

    const { spawn } = require('child_process');
    const cleanup = spawn('node', ['backend/scripts/cleanup_dummy_data.js'], {
      stdio: 'pipe'
    });

    let output = '';
    cleanup.stdout.on('data', (data) => {
      output += data.toString();
    });

    cleanup.stderr.on('data', (data) => {
      output += data.toString();
    });

    cleanup.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dummy data cleanup completed successfully');
      } else {
        console.error('❌ Dummy data cleanup failed with code:', code);
      }
    });

    res.json({
      success: true,
      message: 'Dummy data cleanup initiated. Test/sample data will be removed while preserving real data.',
      info: 'This will remove data from known test companies and sample entries.'
    });

  } catch (error) {
    console.error('Failed to initiate dummy data cleanup:', error);
    res.status(500).json({
      error: 'Failed to initiate dummy data cleanup',
      message: error.message
    });
  }
});

// Get database statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const pool = require('../config/database');

    const stats = {};
    const tables = ['email_events', 'jobs', 'profiles', 'users'];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      } catch (error) {
        stats[table] = 'Error';
      }
    }

    // Get recent activity
    const recentJobs = await pool.query(`
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const recentProfiles = await pool.query(`
      SELECT COUNT(*) as count 
      FROM profiles 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const recentEmails = await pool.query(`
      SELECT COUNT(*) as count 
      FROM email_events 
      WHERE processed_at > NOW() - INTERVAL '7 days'
    `);

    stats.recent_activity = {
      jobs_last_7_days: parseInt(recentJobs.rows[0].count),
      profiles_last_7_days: parseInt(recentProfiles.rows[0].count),
      emails_last_7_days: parseInt(recentEmails.rows[0].count)
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Failed to get database stats:', error);
    res.status(500).json({
      error: 'Failed to get database statistics',
      message: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const gmailImapService = require('../services/gmailImapService');

// Start email monitoring
router.post('/start-monitoring', async (req, res) => {
  try {
    const { intervalMinutes = 60 } = req.body; // Default to 60 minutes (1 hour)
    
    await gmailImapService.startMonitoring(intervalMinutes);
    
    res.json({
      success: true,
      message: `Email monitoring started with ${intervalMinutes} minute intervals`,
      interval: intervalMinutes
    });
  } catch (error) {
    console.error('Failed to start email monitoring:', error);
    res.status(500).json({
      error: 'Failed to start email monitoring',
      message: error.message
    });
  }
});

// Stop email monitoring
router.post('/stop-monitoring', async (req, res) => {
  try {
    gmailImapService.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Email monitoring stopped'
    });
  } catch (error) {
    console.error('Failed to stop email monitoring:', error);
    res.status(500).json({
      error: 'Failed to stop email monitoring',
      message: error.message
    });
  }
});

// Manual email check
router.post('/check-now', async (req, res) => {
  try {
    const jobEmails = await gmailImapService.checkForJobEmails();
    
    res.json({
      success: true,
      message: `Found ${jobEmails.length} job-related emails`,
      emails: jobEmails.map(email => ({
        type: email.type,
        company: email.company,
        jobTitle: email.jobTitle,
        confidence: email.confidence,
        summary: email.summary
      }))
    });
  } catch (error) {
    console.error('Manual email check failed:', error);
    res.status(500).json({
      error: 'Failed to check emails',
      message: error.message
    });
  }
});

// Get email events for a job
router.get('/events/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const query = `
      SELECT * FROM email_events 
      WHERE job_id = $1 
      ORDER BY processed_at DESC
    `;
    
    const pool = require('../config/database');
    const result = await pool.query(query, [jobId]);
    
    res.json({
      success: true,
      events: result.rows.map(event => ({
        id: event.id,
        type: event.email_type,
        subject: event.email_subject,
        from: event.email_from,
        processedAt: event.processed_at,
        metadata: event.metadata
      }))
    });
  } catch (error) {
    console.error('Failed to get email events:', error);
    res.status(500).json({
      error: 'Failed to get email events',
      message: error.message
    });
  }
});

// Get all email events with pagination
router.get('/events', async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;
    
    let query = `
      SELECT e.*, j.job_title, j.company_name 
      FROM email_events e
      LEFT JOIN jobs j ON e.job_id = j.id
    `;
    
    const values = [];
    
    if (type) {
      query += ` WHERE e.email_type = $1`;
      values.push(type);
    }
    
    query += ` ORDER BY e.processed_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);
    
    const pool = require('../config/database');
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      events: result.rows.map(event => ({
        id: event.id,
        type: event.email_type,
        subject: event.email_subject,
        from: event.email_from,
        processedAt: event.processed_at,
        jobTitle: event.job_title,
        companyName: event.company_name,
        metadata: event.metadata
      })),
      total: result.rows.length
    });
  } catch (error) {
    console.error('Failed to get email events:', error);
    res.status(500).json({
      error: 'Failed to get email events',
      message: error.message
    });
  }
});

// Get email monitoring status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: {
      connected: gmailImapService.isConnected,
      lastChecked: gmailImapService.lastCheckedDate,
      monitoring: true // You can add a flag to track if monitoring is active
    }
  });
});

// Get email classification statistics
router.get('/classification-stats', (req, res) => {
  try {
    const emailClassificationService = require('../services/emailClassificationService');
    const stats = emailClassificationService.getClassificationStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Failed to get classification stats:', error);
    res.status(500).json({
      error: 'Failed to get classification statistics',
      message: error.message
    });
  }
});

// Provide feedback on email classification
router.post('/classification-feedback', async (req, res) => {
  try {
    const { emailId, correctType, feedback } = req.body;
    
    if (!emailId || !correctType) {
      return res.status(400).json({
        error: 'Email ID and correct type are required'
      });
    }
    
    const emailClassificationService = require('../services/emailClassificationService');
    await emailClassificationService.improveClassification(emailId, correctType, feedback);
    
    res.json({
      success: true,
      message: 'Classification feedback recorded'
    });
  } catch (error) {
    console.error('Failed to record classification feedback:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error.message
    });
  }
});

// Delete email event
router.delete('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        error: 'Valid email event ID is required'
      });
    }
    
    const pool = require('../config/database');
    
    // First check if the email event exists
    const checkQuery = 'SELECT id, email_subject FROM email_events WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [eventId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Email event not found'
      });
    }
    
    // Delete the email event
    const deleteQuery = 'DELETE FROM email_events WHERE id = $1 RETURNING *';
    const deleteResult = await pool.query(deleteQuery, [eventId]);
    
    console.log(`🗑️ Deleted email event: ${checkResult.rows[0].email_subject}`);
    
    res.json({
      success: true,
      message: 'Email event deleted successfully',
      deletedEvent: {
        id: deleteResult.rows[0].id,
        subject: deleteResult.rows[0].email_subject
      }
    });
  } catch (error) {
    console.error('Failed to delete email event:', error);
    res.status(500).json({
      error: 'Failed to delete email event',
      message: error.message
    });
  }
});

// Bulk delete email events
router.delete('/events', async (req, res) => {
  try {
    const { eventIds } = req.body;
    
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        error: 'Array of email event IDs is required'
      });
    }
    
    // Validate all IDs are numbers
    const invalidIds = eventIds.filter(id => isNaN(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: 'All event IDs must be valid numbers'
      });
    }
    
    const pool = require('../config/database');
    
    // Delete the email events
    const deleteQuery = 'DELETE FROM email_events WHERE id = ANY($1::int[]) RETURNING id, email_subject';
    const deleteResult = await pool.query(deleteQuery, [eventIds]);
    
    console.log(`🗑️ Bulk deleted ${deleteResult.rows.length} email events`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.rows.length} email events`,
      deletedCount: deleteResult.rows.length,
      deletedEvents: deleteResult.rows.map(row => ({
        id: row.id,
        subject: row.email_subject
      }))
    });
  } catch (error) {
    console.error('Failed to bulk delete email events:', error);
    res.status(500).json({
      error: 'Failed to bulk delete email events',
      message: error.message
    });
  }
});

module.exports = router;
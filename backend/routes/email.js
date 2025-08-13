const express = require('express');
const router = express.Router();
const gmailImapService = require('../services/gmailImapService');

// Start email monitoring
router.post('/start-monitoring', async (req, res) => {
  try {
    const { intervalMinutes = 5 } = req.body;
    
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

module.exports = router;
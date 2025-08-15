const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

router.post('/mark-applied', async (req, res) => {
  try {
    const { jobUrl } = req.body;

    if (!jobUrl || typeof jobUrl !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: jobUrl'
      });
    }

    // Validate URL format
    try {
      new URL(jobUrl);
    } catch (urlError) {
      return res.status(400).json({
        error: 'Invalid job URL format'
      });
    }

    // Mark job as applied in database
    const updatedJob = await databaseService.markJobAsApplied(jobUrl, req.user.id);

    if (!updatedJob) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'No job found with the provided URL'
      });
    }

    res.json({
      success: true,
      job: {
        id: updatedJob.id,
        jobTitle: updatedJob.job_title,
        companyName: updatedJob.company_name,
        platform: updatedJob.platform,
        jobUrl: updatedJob.job_url,
        applicationStatus: updatedJob.application_status,
        appliedDate: updatedJob.applied_date
      },
      message: 'Job marked as applied successfully'
    });

  } catch (error) {
    console.error('Mark job applied error:', error);
    res.status(500).json({
      error: 'Failed to mark job as applied',
      message: error.message
    });
  }
});

// Update job status (more general endpoint)
router.post('/update-status', async (req, res) => {
  try {
    const { jobUrl, status } = req.body;

    if (!jobUrl || !status) {
      return res.status(400).json({
        error: 'Missing required fields: jobUrl, status'
      });
    }

    const validStatuses = ['viewed', 'applied', 'interviewing', 'rejected', 'offer', 'assessment'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Update job status in database
    const query = `
      UPDATE jobs 
      SET application_status = $1, 
          applied_date = CASE WHEN $1 = 'applied' AND applied_date IS NULL THEN CURRENT_DATE ELSE applied_date END,
          last_seen_at = CURRENT_TIMESTAMP
      WHERE job_url = $2
      RETURNING *;
    `;

    const pool = require('../config/database');
    const result = await pool.query(query, [status, jobUrl]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'No job found with the provided URL'
      });
    }

    const updatedJob = result.rows[0];

    res.json({
      success: true,
      job: {
        id: updatedJob.id,
        jobTitle: updatedJob.job_title,
        companyName: updatedJob.company_name,
        platform: updatedJob.platform,
        jobUrl: updatedJob.job_url,
        applicationStatus: updatedJob.application_status,
        appliedDate: updatedJob.applied_date,
        lastSeenAt: updatedJob.last_seen_at
      },
      message: `Job status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      error: 'Failed to update job status',
      message: error.message
    });
  }
});

// Get jobs with filtering
router.get('/', async (req, res) => {
  try {
    const { status, limit = 100, offset = 0, search } = req.query;

    const jobs = await databaseService.getJobs(req.user.id, status, parseInt(limit), parseInt(offset));

    // Apply search filter if provided
    let filteredJobs = jobs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = jobs.filter(job => 
        job.job_title.toLowerCase().includes(searchLower) ||
        job.company_name.toLowerCase().includes(searchLower) ||
        job.platform.toLowerCase().includes(searchLower)
      );
    }

    // Format response
    const formattedJobs = filteredJobs.map(job => ({
      id: job.id,
      jobTitle: job.job_title,
      companyName: job.company_name,
      platform: job.platform,
      jobUrl: job.job_url,
      location: job.location,
      postedDate: job.posted_date,
      appliedDate: job.applied_date,
      applicationStatus: job.application_status,
      notes: job.notes,
      lastSeenAt: job.last_seen_at,
      createdAt: job.created_at
    }));

    res.json({
      success: true,
      jobs: formattedJobs,
      total: filteredJobs.length,
      filters: {
        status: status || 'all',
        search: search || null
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      message: error.message
    });
  }
});

// Add notes to a job
router.post('/add-note', async (req, res) => {
  try {
    const { jobUrl, note } = req.body;

    if (!jobUrl || !note) {
      return res.status(400).json({
        error: 'Missing required fields: jobUrl, note'
      });
    }

    const query = `
      UPDATE jobs 
      SET notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN $1
        ELSE notes || '\n---\n' || $1
      END,
      last_seen_at = CURRENT_TIMESTAMP
      WHERE job_url = $2
      RETURNING *;
    `;

    const pool = require('../config/database');
    const result = await pool.query(query, [note.trim(), jobUrl]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const updatedJob = result.rows[0];

    res.json({
      success: true,
      job: {
        id: updatedJob.id,
        jobTitle: updatedJob.job_title,
        companyName: updatedJob.company_name,
        notes: updatedJob.notes
      },
      message: 'Note added successfully'
    });

  } catch (error) {
    console.error('Add job note error:', error);
    res.status(500).json({
      error: 'Failed to add note',
      message: error.message
    });
  }
});

// Delete job
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({
        error: 'Valid job ID is required'
      });
    }
    
    const pool = require('../config/database');
    
    // First check if the job exists
    const checkQuery = 'SELECT id, job_title, company_name FROM jobs WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [jobId, req.user.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    // Delete related email events first (cascade)
    await pool.query('DELETE FROM email_events WHERE job_id = $1', [jobId]);
    
    // Delete the job
    const deleteQuery = 'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *';
    const deleteResult = await pool.query(deleteQuery, [jobId, req.user.id]);
    
    console.log(`🗑️ Deleted job: ${checkResult.rows[0].job_title} at ${checkResult.rows[0].company_name}`);
    
    res.json({
      success: true,
      message: 'Job deleted successfully',
      deletedJob: {
        id: deleteResult.rows[0].id,
        title: deleteResult.rows[0].job_title,
        company: deleteResult.rows[0].company_name
      }
    });
  } catch (error) {
    console.error('Failed to delete job:', error);
    res.status(500).json({
      error: 'Failed to delete job',
      message: error.message
    });
  }
});

// Bulk delete jobs
router.delete('/', async (req, res) => {
  try {
    const { jobIds } = req.body;
    
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        error: 'Array of job IDs is required'
      });
    }
    
    // Validate all IDs are numbers
    const invalidIds = jobIds.filter(id => isNaN(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: 'All job IDs must be valid numbers'
      });
    }
    
    const pool = require('../config/database');
    
    // Delete related email events first (cascade)
    await pool.query('DELETE FROM email_events WHERE job_id = ANY($1::int[])', [jobIds]);
    
    // Delete the jobs
    const deleteQuery = 'DELETE FROM jobs WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id, job_title, company_name';
    const deleteResult = await pool.query(deleteQuery, [jobIds, req.user.id]);
    
    console.log(`🗑️ Bulk deleted ${deleteResult.rows.length} jobs`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.rows.length} jobs`,
      deletedCount: deleteResult.rows.length,
      deletedJobs: deleteResult.rows.map(row => ({
        id: row.id,
        title: row.job_title,
        company: row.company_name
      }))
    });
  } catch (error) {
    console.error('Failed to bulk delete jobs:', error);
    res.status(500).json({
      error: 'Failed to bulk delete jobs',
      message: error.message
    });
  }
});

module.exports = router;
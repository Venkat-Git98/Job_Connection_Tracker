const express = require('express');
const router = express.Router();

// Helper function to check if user_id column exists
async function hasUserIdColumn(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = 'user_id'
    `, [tableName]);
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

// Get comprehensive analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const pool = require('../config/database');
    
    // Calculate date range
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Check if tables have user_id columns (multi-user support)
    const jobsHasUserId = await hasUserIdColumn(pool, 'jobs');
    const profilesHasUserId = await hasUserIdColumn(pool, 'profiles');
    const emailEventsHasUserId = await hasUserIdColumn(pool, 'email_events');
    
    // Build queries based on whether user_id columns exist
    const userId = req.user?.id || 1; // Default to 1 if no user context
    
    // Get daily application stats
    const dailyStatsQuery = jobsHasUserId ? `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as applications,
        COUNT(CASE WHEN application_status != 'viewed' THEN 1 END) as applied,
        COUNT(CASE WHEN application_status IN ('interviewing', 'rejected', 'offer') THEN 1 END) as responses
      FROM jobs 
      WHERE created_at >= $1 AND user_id = $2
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT $3
    ` : `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as applications,
        COUNT(CASE WHEN application_status != 'viewed' THEN 1 END) as applied,
        COUNT(CASE WHEN application_status IN ('interviewing', 'rejected', 'offer') THEN 1 END) as responses
      FROM jobs 
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT $2
    `;
    
    const dailyStatsParams = jobsHasUserId ? [startDate, userId, daysBack] : [startDate, daysBack];
    const dailyStats = await pool.query(dailyStatsQuery, dailyStatsParams);
    
    // Get status breakdown
    const statusQuery = jobsHasUserId ? `
      SELECT application_status, COUNT(*) as count
      FROM jobs
      WHERE user_id = $1
      GROUP BY application_status
    ` : `
      SELECT application_status, COUNT(*) as count
      FROM jobs
      GROUP BY application_status
    `;
    
    const statusParams = jobsHasUserId ? [userId] : [];
    const statusBreakdown = await pool.query(statusQuery, statusParams);
    
    // Get email type breakdown
    const emailTypeQuery = emailEventsHasUserId ? `
      SELECT email_type, COUNT(*) as count
      FROM email_events
      WHERE processed_at >= $1 AND user_id = $2
      GROUP BY email_type
    ` : `
      SELECT email_type, COUNT(*) as count
      FROM email_events
      WHERE processed_at >= $1
      GROUP BY email_type
    `;
    
    const emailTypeParams = emailEventsHasUserId ? [startDate, userId] : [startDate];
    const emailTypes = await pool.query(emailTypeQuery, emailTypeParams);
    
    // Get company stats
    const companyStatsQuery = jobsHasUserId ? `
      SELECT 
        company_name,
        COUNT(*) as applications,
        COUNT(CASE WHEN application_status = 'interviewing' THEN 1 END) as interviews,
        COUNT(CASE WHEN application_status = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejections
      FROM jobs
      WHERE user_id = $1
      GROUP BY company_name
      ORDER BY applications DESC
      LIMIT 15
    ` : `
      SELECT 
        company_name,
        COUNT(*) as applications,
        COUNT(CASE WHEN application_status = 'interviewing' THEN 1 END) as interviews,
        COUNT(CASE WHEN application_status = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejections
      FROM jobs
      GROUP BY company_name
      ORDER BY applications DESC
      LIMIT 15
    `;
    
    const companyStatsParams = jobsHasUserId ? [userId] : [];
    const companyStats = await pool.query(companyStatsQuery, companyStatsParams);
    
    // Get response rate analytics
    const responseRateQuery = jobsHasUserId ? `
      SELECT 
        COUNT(CASE WHEN application_status != 'viewed' THEN 1 END) as applied_jobs,
        COUNT(CASE WHEN application_status IN ('interviewing', 'offer', 'rejected') THEN 1 END) as responses,
        AVG(CASE 
          WHEN application_status IN ('interviewing', 'offer', 'rejected') 
          THEN EXTRACT(DAY FROM (last_seen_at - created_at))
        END) as avg_response_days
      FROM jobs
      WHERE user_id = $1
    ` : `
      SELECT 
        COUNT(CASE WHEN application_status != 'viewed' THEN 1 END) as applied_jobs,
        COUNT(CASE WHEN application_status IN ('interviewing', 'offer', 'rejected') THEN 1 END) as responses,
        AVG(CASE 
          WHEN application_status IN ('interviewing', 'offer', 'rejected') 
          THEN EXTRACT(DAY FROM (last_seen_at - created_at))
        END) as avg_response_days
      FROM jobs
    `;
    
    const responseRateParams = jobsHasUserId ? [userId] : [];
    const responseRate = await pool.query(responseRateQuery, responseRateParams);
    
    // Get platform breakdown
    const platformQuery = jobsHasUserId ? `
      SELECT platform, COUNT(*) as count
      FROM jobs
      WHERE user_id = $1
      GROUP BY platform
      ORDER BY count DESC
    ` : `
      SELECT platform, COUNT(*) as count
      FROM jobs
      GROUP BY platform
      ORDER BY count DESC
    `;
    
    const platformStatsParams = jobsHasUserId ? [userId] : [];
    const platformStats = await pool.query(platformQuery, platformStatsParams);
    
    // Get recent activity
    const recentActivityQuery = jobsHasUserId && emailEventsHasUserId ? `
      (
        SELECT 'job' as type, job_title as title, company_name as company, 
               application_status as status, created_at as date
        FROM jobs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      )
      UNION ALL
      (
        SELECT 'email' as type, email_subject as title, 
               COALESCE((SELECT company_name FROM jobs WHERE id = email_events.job_id AND user_id = $1), 'Unknown') as company,
               email_type as status, processed_at as date
        FROM email_events
        WHERE user_id = $1
        ORDER BY processed_at DESC
        LIMIT 10
      )
      ORDER BY date DESC
      LIMIT 15
    ` : jobsHasUserId ? `
      SELECT 'job' as type, job_title as title, company_name as company, 
             application_status as status, created_at as date
      FROM jobs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 15
    ` : `
      (
        SELECT 'job' as type, job_title as title, company_name as company, 
               application_status as status, created_at as date
        FROM jobs
        ORDER BY created_at DESC
        LIMIT 10
      )
      UNION ALL
      (
        SELECT 'email' as type, email_subject as title, 
               COALESCE((SELECT company_name FROM jobs WHERE id = email_events.job_id), 'Unknown') as company,
               email_type as status, processed_at as date
        FROM email_events
        ORDER BY processed_at DESC
        LIMIT 10
      )
      ORDER BY date DESC
      LIMIT 15
    `;
    
    const recentActivityParams = jobsHasUserId ? [userId] : [];
    const recentActivity = await pool.query(recentActivityQuery, recentActivityParams);
    
    // Calculate trends
    const trendsQuery = jobsHasUserId ? `
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as applications,
        COUNT(CASE WHEN application_status != 'viewed' THEN 1 END) as applied
      FROM jobs
      WHERE created_at >= $1 AND user_id = $2
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week DESC
    ` : `
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as applications,
        COUNT(CASE WHEN application_status != 'viewed' THEN 1 END) as applied
      FROM jobs
      WHERE created_at >= $1
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week DESC
    `;
    
    const trendsParams = jobsHasUserId ? [startDate, userId] : [startDate];
    const weeklyTrends = await pool.query(trendsQuery, trendsParams);
    
    res.json({
      success: true,
      analytics: {
        dailyStats: dailyStats.rows,
        statusBreakdown: statusBreakdown.rows.reduce((acc, row) => {
          acc[row.application_status] = parseInt(row.count);
          return acc;
        }, {}),
        emailTypeBreakdown: emailTypes.rows.reduce((acc, row) => {
          acc[row.email_type] = parseInt(row.count);
          return acc;
        }, {}),
        companyStats: companyStats.rows.map(row => ({
          name: row.company_name,
          applications: parseInt(row.applications),
          interviews: parseInt(row.interviews),
          offers: parseInt(row.offers),
          rejections: parseInt(row.rejections)
        })),
        responseRate: responseRate.rows[0] ? {
          appliedJobs: parseInt(responseRate.rows[0].applied_jobs),
          responses: parseInt(responseRate.rows[0].responses),
          avgResponseDays: parseFloat(responseRate.rows[0].avg_response_days) || 0,
          responseRate: responseRate.rows[0].applied_jobs > 0 ? 
            (parseInt(responseRate.rows[0].responses) / parseInt(responseRate.rows[0].applied_jobs) * 100).toFixed(1) : 0
        } : { appliedJobs: 0, responses: 0, avgResponseDays: 0, responseRate: 0 },
        platformStats: platformStats.rows.reduce((acc, row) => {
          acc[row.platform] = parseInt(row.count);
          return acc;
        }, {}),
        recentActivity: recentActivity.rows,
        weeklyTrends: weeklyTrends.rows
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    
    // Fallback: return empty analytics if there's a schema issue
    if (error.message.includes('user_id') || error.message.includes('column') || error.message.includes('does not exist')) {
      console.log('🔧 Schema issue detected, returning empty analytics. Run: node backend/scripts/fix_analytics_schema.js');
      
      res.json({
        success: true,
        analytics: {
          dailyStats: [],
          statusBreakdown: {},
          emailTypeBreakdown: {},
          companyStats: [],
          responseRate: {
            appliedJobs: 0,
            responses: 0,
            avgResponseDays: 0,
            responseRate: 0
          },
          platformStats: {},
          recentActivity: [],
          weeklyTrends: []
        },
        warning: 'Schema issue detected. Please run the database fix script.',
        fixCommand: 'node backend/scripts/fix_analytics_schema.js'
      });
    } else {
      res.status(500).json({
        error: 'Failed to load analytics',
        message: error.message
      });
    }
  }
});

// Get job search performance metrics
router.get('/performance', async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Check if tables have user_id columns
    const jobsHasUserId = await hasUserIdColumn(pool, 'jobs');
    const emailEventsHasUserId = await hasUserIdColumn(pool, 'email_events');
    const userId = req.user?.id || 1;
    
    // Get performance metrics
    const performanceQuery = jobsHasUserId ? `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN application_status = 'applied' THEN 1 END) as actually_applied,
        COUNT(CASE WHEN application_status = 'interviewing' THEN 1 END) as interviews,
        COUNT(CASE WHEN application_status = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejections,
        COUNT(DISTINCT company_name) as unique_companies,
        COUNT(DISTINCT platform) as platforms_used,
        MIN(created_at) as first_application,
        MAX(created_at) as latest_application
      FROM jobs
      WHERE user_id = $1
    ` : `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN application_status = 'applied' THEN 1 END) as actually_applied,
        COUNT(CASE WHEN application_status = 'interviewing' THEN 1 END) as interviews,
        COUNT(CASE WHEN application_status = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejections,
        COUNT(DISTINCT company_name) as unique_companies,
        COUNT(DISTINCT platform) as platforms_used,
        MIN(created_at) as first_application,
        MAX(created_at) as latest_application
      FROM jobs
    `;
    
    const performanceParams = jobsHasUserId ? [userId] : [];
    const performance = await pool.query(performanceQuery, performanceParams);
    
    // Get email response metrics
    const emailMetricsQuery = emailEventsHasUserId ? `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN email_type = 'rejection' THEN 1 END) as rejections,
        COUNT(CASE WHEN email_type = 'assessment' THEN 1 END) as assessments,
        COUNT(CASE WHEN email_type = 'interview_invite' THEN 1 END) as interview_invites,
        COUNT(CASE WHEN email_type = 'offer' THEN 1 END) as offers
      FROM email_events
      WHERE user_id = $1
    ` : `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN email_type = 'rejection' THEN 1 END) as rejections,
        COUNT(CASE WHEN email_type = 'assessment' THEN 1 END) as assessments,
        COUNT(CASE WHEN email_type = 'interview_invite' THEN 1 END) as interview_invites,
        COUNT(CASE WHEN email_type = 'offer' THEN 1 END) as offers
      FROM email_events
    `;
    
    const emailMetricsParams = emailEventsHasUserId ? [userId] : [];
    const emailMetrics = await pool.query(emailMetricsQuery, emailMetricsParams);
    
    // Calculate success rates
    const metrics = performance.rows[0] || {
      total_applications: 0,
      actually_applied: 0,
      interviews: 0,
      offers: 0,
      rejections: 0,
      unique_companies: 0,
      platforms_used: 0,
      first_application: null,
      latest_application: null
    };
    const emailStats = emailMetrics.rows[0] || {
      total_emails: 0,
      rejections: 0,
      assessments: 0,
      interview_invites: 0,
      offers: 0
    };
    
    const appliedNum = Number(metrics.actually_applied || 0);
    const interviewsNum = Number(metrics.interviews || 0);
    const offersNum = Number(metrics.offers || 0);
    const successRates = {
      applicationToInterview: appliedNum > 0 ? ((interviewsNum / appliedNum) * 100).toFixed(1) : 0,
      interviewToOffer: interviewsNum > 0 ? ((offersNum / interviewsNum) * 100).toFixed(1) : 0,
      overallSuccess: appliedNum > 0 ? ((offersNum / appliedNum) * 100).toFixed(1) : 0
    };
    
    res.json({
      success: true,
      performance: {
        ...metrics,
        emailStats,
        successRates,
        daysActive: metrics.first_application ? 
          Math.ceil((new Date() - new Date(metrics.first_application)) / (1000 * 60 * 60 * 24)) : 0
      }
    });
    
  } catch (error) {
    console.error('Performance analytics error:', error);
    
    // Fallback for schema issues
    if (error.message.includes('user_id') || error.message.includes('column') || error.message.includes('does not exist')) {
      res.json({
        success: true,
        performance: {
          total_applications: 0,
          actually_applied: 0,
          interviews: 0,
          offers: 0,
          rejections: 0,
          unique_companies: 0,
          platforms_used: 0,
          first_application: null,
          latest_application: null,
          emailStats: {
            total_emails: 0,
            rejections: 0,
            assessments: 0,
            interview_invites: 0,
            offers: 0
          },
          successRates: {
            applicationToInterview: 0,
            interviewToOffer: 0,
            overallSuccess: 0
          },
          daysActive: 0
        },
        warning: 'Schema issue detected. Please run the database fix script.'
      });
    } else {
      res.status(500).json({
        error: 'Failed to load performance metrics',
        message: error.message
      });
    }
  }
});

module.exports = router;
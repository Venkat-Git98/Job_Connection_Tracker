const pool = require('../config/database');

class DatabaseService {
  async upsertProfile(profileData, userId) {
    if (!userId) {
      throw new Error('User ID is required for profile operations');
    }
    
    const {
      personName,
      profileUrl,
      currentTitle,
      currentCompany,
      location,
      headline,
      about,
      experiences
    } = profileData;

    const query = `
      INSERT INTO profiles (
        user_id, person_name, profile_url, current_title, current_company, 
        location, headline, about, experiences, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, profile_url) 
      DO UPDATE SET
        person_name = EXCLUDED.person_name,
        current_title = EXCLUDED.current_title,
        current_company = EXCLUDED.current_company,
        location = EXCLUDED.location,
        headline = EXCLUDED.headline,
        about = EXCLUDED.about,
        experiences = EXCLUDED.experiences,
        last_seen_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      userId,
      personName,
      profileUrl,
      currentTitle,
      currentCompany,
      location,
      headline,
      about,
      JSON.stringify(experiences || [])
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async upsertJob(jobData, userId) {
    if (!userId) {
      throw new Error('User ID is required for job operations');
    }
    
    const {
      jobTitle,
      companyName,
      platform,
      jobUrl,
      location,
      postedDate,
      applicationStatus = 'viewed'
    } = jobData;

    const query = `
      INSERT INTO jobs (
        user_id, job_title, company_name, platform, job_url, 
        location, posted_date, application_status, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, job_url)
      DO UPDATE SET
        job_title = EXCLUDED.job_title,
        company_name = EXCLUDED.company_name,
        platform = EXCLUDED.platform,
        location = EXCLUDED.location,
        posted_date = EXCLUDED.posted_date,
        last_seen_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      userId,
      jobTitle,
      companyName,
      platform,
      jobUrl,
      location,
      postedDate,
      applicationStatus
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getProfiles(userId, search = '', limit = 100, offset = 0) {
    if (!userId) {
      throw new Error('User ID is required for profile operations');
    }

    let query = `
      SELECT p.*, o.connection_status, o.first_contact_date, o.last_contact_date,
             o.connection_request_text
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id AND o.user_id = $1
      WHERE p.user_id = $1
    `;
    
    const values = [userId];
    
    if (search) {
      query += ` AND (p.person_name ILIKE $${values.length + 1} OR p.current_company ILIKE $${values.length + 1})`;
      values.push(`%${search}%`);
    }
    
    query += ` ORDER BY p.last_seen_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getJobs(userId, status = '', limit = 100, offset = 0) {
    if (!userId) {
      throw new Error('User ID is required for job operations');
    }

    let query = `SELECT * FROM jobs WHERE user_id = $1`;
    const values = [userId];
    
    if (status) {
      query += ` AND application_status = $${values.length + 1}`;
      values.push(status);
    }
    
    query += ` ORDER BY last_seen_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateJobStatus(jobUrl, status, userId) {
    if (!userId) {
      throw new Error('User ID is required for job operations');
    }

    const query = `
      UPDATE jobs 
      SET application_status = $1,
          applied_date = CASE WHEN $1 = 'applied' AND applied_date IS NULL THEN CURRENT_DATE ELSE applied_date END,
          last_seen_at = CURRENT_TIMESTAMP
      WHERE job_url = $2 AND user_id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [status, jobUrl, userId]);
    return result.rows[0];
  }

  async getOutreachByCompany(userId) {
    if (!userId) {
      userId = 1; // Default fallback
    }

    // Check if profiles table has user_id column
    const hasUserIdColumn = await this.checkUserIdColumn('profiles');
    
    const query = hasUserIdColumn ? `
      SELECT p.current_company, 
             json_agg(
               json_build_object(
                 'id', p.id,
                 'person_name', p.person_name,
                 'profile_url', p.profile_url,
                 'current_title', p.current_title,
                 'connection_status', o.connection_status,
                 'last_contact_date', o.last_contact_date
               )
             ) as profiles
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id AND o.user_id = $1
      WHERE p.current_company IS NOT NULL AND p.user_id = $1
      GROUP BY p.current_company
      ORDER BY p.current_company;
    ` : `
      SELECT p.current_company, 
             json_agg(
               json_build_object(
                 'id', p.id,
                 'person_name', p.person_name,
                 'profile_url', p.profile_url,
                 'current_title', p.current_title,
                 'connection_status', o.connection_status,
                 'last_contact_date', o.last_contact_date
               )
             ) as profiles
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id
      WHERE p.current_company IS NOT NULL
      GROUP BY p.current_company
      ORDER BY p.current_company;
    `;

    const params = hasUserIdColumn ? [userId] : [];
    const result = await pool.query(query, params);
    return result.rows;
  }

  async checkUserIdColumn(tableName) {
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

  async markJobAsApplied(jobUrl, userId) {
    if (!userId) {
      throw new Error('User ID is required for job operations');
    }

    const query = `
      UPDATE jobs 
      SET application_status = 'applied', applied_date = CURRENT_DATE
      WHERE job_url = $1 AND user_id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [jobUrl, userId]);
    return result.rows[0];
  }

  async createOutreach(profileId, connectionRequestText, userId) {
    if (!userId) {
      throw new Error('User ID is required for outreach operations');
    }

    const query = `
      INSERT INTO outreach (user_id, profile_id, first_contact_date, connection_request_text)
      VALUES ($1, $2, CURRENT_DATE, $3)
      ON CONFLICT (user_id, profile_id)
      DO UPDATE SET
        last_contact_date = CURRENT_DATE,
        connection_request_text = EXCLUDED.connection_request_text
      RETURNING *;
    `;

    const result = await pool.query(query, [userId, profileId, connectionRequestText]);
    return result.rows[0];
  }

  async updateConnectionStatus(profileId, status, userId) {
    if (!userId) {
      throw new Error('User ID is required for outreach operations');
    }

    const query = `
      UPDATE outreach 
      SET connection_status = $1, last_contact_date = CURRENT_DATE
      WHERE profile_id = $2 AND user_id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [status, profileId, userId]);
    return result.rows[0];
  }

  // New methods for user-specific analytics
  async getUserAnalytics(userId, timeframe = '30d') {
    if (!userId) {
      throw new Error('User ID is required for analytics operations');
    }

    const timeCondition = this.getTimeCondition(timeframe);
    
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM profiles WHERE user_id = $1) as total_profiles,
        (SELECT COUNT(*) FROM jobs WHERE user_id = $1) as total_jobs,
        (SELECT COUNT(*) FROM jobs WHERE user_id = $1 AND application_status = 'applied') as applied_jobs,
        (SELECT COUNT(*) FROM outreach WHERE user_id = $1 AND connection_status = 'accepted') as accepted_connections,
        (SELECT COUNT(*) FROM outreach WHERE user_id = $1 AND connection_status = 'requested') as pending_connections,
        (SELECT COUNT(DISTINCT current_company) FROM profiles WHERE user_id = $1 AND current_company IS NOT NULL) as unique_companies
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async getUserRecentActivity(userId, limit = 10) {
    if (!userId) {
      throw new Error('User ID is required for activity operations');
    }

    const query = `
      (SELECT 'profile' as type, person_name as title, current_company as subtitle, 
              last_seen_at as timestamp, profile_url as url
       FROM profiles WHERE user_id = $1)
      UNION ALL
      (SELECT 'job' as type, job_title as title, company_name as subtitle, 
              last_seen_at as timestamp, job_url as url
       FROM jobs WHERE user_id = $1)
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  getTimeCondition(timeframe) {
    switch (timeframe) {
      case '7d':
        return "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      case '30d':
        return "created_at >= CURRENT_DATE - INTERVAL '30 days'";
      case '90d':
        return "created_at >= CURRENT_DATE - INTERVAL '90 days'";
      default:
        return "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }
  }
}

module.exports = new DatabaseService();
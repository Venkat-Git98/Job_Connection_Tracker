const pool = require('../config/database');

class DatabaseService {
  async upsertProfile(profileData) {
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
        person_name, profile_url, current_title, current_company, 
        location, headline, about, experiences, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (profile_url) 
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

  async upsertJob(jobData) {
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
        job_title, company_name, platform, job_url, 
        location, posted_date, application_status, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (job_url)
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

  async getProfiles(search = '', limit = 100, offset = 0) {
    let query = `
      SELECT p.*, o.connection_status, o.first_contact_date, o.last_contact_date,
             o.connection_request_text
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id
    `;
    
    const values = [];
    
    if (search) {
      query += ` WHERE p.person_name ILIKE $1 OR p.current_company ILIKE $1`;
      values.push(`%${search}%`);
    }
    
    query += ` ORDER BY p.last_seen_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getJobs(status = '', limit = 100, offset = 0) {
    let query = `SELECT * FROM jobs`;
    const values = [];
    
    if (status) {
      query += ` WHERE application_status = $1`;
      values.push(status);
    }
    
    query += ` ORDER BY last_seen_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateJobStatus(jobUrl, status) {
    const query = `
      UPDATE jobs 
      SET application_status = $1,
          applied_date = CASE WHEN $1 = 'applied' AND applied_date IS NULL THEN CURRENT_DATE ELSE applied_date END,
          last_seen_at = CURRENT_TIMESTAMP
      WHERE job_url = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [status, jobUrl]);
    return result.rows[0];
  }

  async getOutreachByCompany() {
    const query = `
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

    const result = await pool.query(query);
    return result.rows;
  }

  async markJobAsApplied(jobUrl) {
    const query = `
      UPDATE jobs 
      SET application_status = 'applied', applied_date = CURRENT_DATE
      WHERE job_url = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [jobUrl]);
    return result.rows[0];
  }

  async createOutreach(profileId, connectionRequestText) {
    const query = `
      INSERT INTO outreach (profile_id, first_contact_date, connection_request_text)
      VALUES ($1, CURRENT_DATE, $2)
      ON CONFLICT (profile_id)
      DO UPDATE SET
        last_contact_date = CURRENT_DATE,
        connection_request_text = EXCLUDED.connection_request_text
      RETURNING *;
    `;

    const result = await pool.query(query, [profileId, connectionRequestText]);
    return result.rows[0];
  }

  async updateConnectionStatus(profileId, status) {
    const query = `
      UPDATE outreach 
      SET connection_status = $1, last_contact_date = CURRENT_DATE
      WHERE profile_id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [status, profileId]);
    return result.rows[0];
  }
}

module.exports = new DatabaseService();
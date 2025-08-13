const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

// Get outreach data grouped by company
router.get('/', async (req, res) => {
  try {
    const companies = await databaseService.getOutreachByCompany();

    // Format the response
    const formattedCompanies = companies.map(company => ({
      companyName: company.current_company,
      profiles: company.profiles.filter(profile => profile.person_name), // Filter out null profiles
      totalContacts: company.profiles.length,
      contactedCount: company.profiles.filter(p => p.connection_status && p.connection_status !== 'none').length,
      acceptedCount: company.profiles.filter(p => p.connection_status === 'accepted').length
    })).filter(company => company.profiles.length > 0); // Only include companies with profiles

    res.json({
      success: true,
      companies: formattedCompanies,
      totalCompanies: formattedCompanies.length,
      totalProfiles: formattedCompanies.reduce((sum, company) => sum + company.totalContacts, 0)
    });

  } catch (error) {
    console.error('Get outreach error:', error);
    res.status(500).json({
      error: 'Failed to retrieve outreach data',
      message: error.message
    });
  }
});

// Get outreach summary statistics
router.get('/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.current_company,
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN o.connection_status = 'requested' THEN 1 END) as requested,
        COUNT(CASE WHEN o.connection_status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN o.connection_status = 'declined' THEN 1 END) as declined,
        MAX(o.last_contact_date) as last_contact_date,
        MIN(o.first_contact_date) as first_contact_date
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id
      WHERE p.current_company IS NOT NULL AND p.current_company != ''
      GROUP BY p.current_company
      ORDER BY total_contacts DESC, p.current_company;
    `;

    const pool = require('../config/database');
    const result = await pool.query(query);

    const summary = result.rows.map(row => ({
      companyName: row.current_company,
      totalContacts: parseInt(row.total_contacts),
      requested: parseInt(row.requested || 0),
      accepted: parseInt(row.accepted || 0),
      declined: parseInt(row.declined || 0),
      notContacted: parseInt(row.total_contacts) - parseInt(row.requested || 0) - parseInt(row.accepted || 0) - parseInt(row.declined || 0),
      lastContactDate: row.last_contact_date,
      firstContactDate: row.first_contact_date,
      responseRate: row.requested > 0 ? ((parseInt(row.accepted || 0) / parseInt(row.requested)) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      summary,
      totalCompanies: summary.length
    });

  } catch (error) {
    console.error('Get outreach summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve outreach summary',
      message: error.message
    });
  }
});

// Add a company manually (for creating company buckets)
router.post('/add-company', async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName || typeof companyName !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: companyName'
      });
    }

    const trimmedCompanyName = companyName.trim();
    
    if (trimmedCompanyName.length === 0) {
      return res.status(400).json({
        error: 'Company name cannot be empty'
      });
    }

    // Check if company already exists
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM profiles 
      WHERE current_company ILIKE $1;
    `;

    const pool = require('../config/database');
    const checkResult = await pool.query(checkQuery, [trimmedCompanyName]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Company already exists',
        message: `Company "${trimmedCompanyName}" already has profiles in the system`
      });
    }

    // Create a placeholder profile for the company
    const insertQuery = `
      INSERT INTO profiles (
        person_name, profile_url, current_company, headline, last_seen_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const placeholderUrl = `https://linkedin.com/company/${trimmedCompanyName.toLowerCase().replace(/\s+/g, '-')}`;
    const result = await pool.query(insertQuery, [
      `${trimmedCompanyName} - Company Placeholder`,
      placeholderUrl,
      trimmedCompanyName,
      'Company placeholder for tracking purposes'
    ]);

    res.json({
      success: true,
      company: {
        name: trimmedCompanyName,
        profileId: result.rows[0].id
      },
      message: `Company "${trimmedCompanyName}" added successfully`
    });

  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({
      error: 'Failed to add company',
      message: error.message
    });
  }
});

// Get profiles for a specific company
router.get('/company/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params;
    
    if (!companyName) {
      return res.status(400).json({
        error: 'Company name is required'
      });
    }

    const query = `
      SELECT p.*, o.connection_status, o.first_contact_date, o.last_contact_date,
             o.connection_request_text, o.notes
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id
      WHERE p.current_company ILIKE $1
      ORDER BY p.last_seen_at DESC;
    `;

    const pool = require('../config/database');
    const result = await pool.query(query, [`%${companyName}%`]);

    const profiles = result.rows.map(profile => ({
      id: profile.id,
      personName: profile.person_name,
      profileUrl: profile.profile_url,
      currentTitle: profile.current_title,
      currentCompany: profile.current_company,
      location: profile.location,
      headline: profile.headline,
      connectionStatus: profile.connection_status || 'none',
      firstContactDate: profile.first_contact_date,
      lastContactDate: profile.last_contact_date,
      connectionRequestText: profile.connection_request_text,
      notes: profile.notes,
      lastSeenAt: profile.last_seen_at
    }));

    res.json({
      success: true,
      companyName,
      profiles,
      totalProfiles: profiles.length
    });

  } catch (error) {
    console.error('Get company profiles error:', error);
    res.status(500).json({
      error: 'Failed to retrieve company profiles',
      message: error.message
    });
  }
});

module.exports = router;
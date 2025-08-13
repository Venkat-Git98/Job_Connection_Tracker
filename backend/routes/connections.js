const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

// Get all connections/profiles with search and filtering
router.get('/', async (req, res) => {
  try {
    const { search, status, limit = 100, offset = 0 } = req.query;

    const profiles = await databaseService.getProfiles(search, parseInt(limit), parseInt(offset));

    // Apply status filter if provided
    let filteredProfiles = profiles;
    if (status && status !== 'all') {
      filteredProfiles = profiles.filter(profile => 
        profile.connection_status === status
      );
    }

    // Format response
    const formattedProfiles = filteredProfiles.map(profile => ({
      id: profile.id,
      personName: profile.person_name,
      profileUrl: profile.profile_url,
      currentTitle: profile.current_title,
      currentCompany: profile.current_company,
      location: profile.location,
      headline: profile.headline,
      about: profile.about,
      experiences: profile.experiences,
      lastSeenAt: profile.last_seen_at,
      createdAt: profile.created_at,
      // Outreach information
      connectionStatus: profile.connection_status || 'none',
      firstContactDate: profile.first_contact_date,
      lastContactDate: profile.last_contact_date,
      connectionRequestText: profile.connection_request_text
    }));

    res.json({
      success: true,
      connections: formattedProfiles,
      total: filteredProfiles.length,
      filters: {
        search: search || null,
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      error: 'Failed to retrieve connections',
      message: error.message
    });
  }
});

// Update connection status
router.post('/update-status', async (req, res) => {
  try {
    const { profileId, status } = req.body;

    if (!profileId || !status) {
      return res.status(400).json({
        error: 'Missing required fields: profileId, status'
      });
    }

    const validStatuses = ['none', 'requested', 'accepted', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    const updatedOutreach = await databaseService.updateConnectionStatus(profileId, status);

    if (!updatedOutreach) {
      return res.status(404).json({
        error: 'Profile not found or no outreach record exists'
      });
    }

    res.json({
      success: true,
      outreach: {
        id: updatedOutreach.id,
        profileId: updatedOutreach.profile_id,
        connectionStatus: updatedOutreach.connection_status,
        lastContactDate: updatedOutreach.last_contact_date
      },
      message: `Connection status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Update connection status error:', error);
    res.status(500).json({
      error: 'Failed to update connection status',
      message: error.message
    });
  }
});

// Get connection statistics
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN o.connection_status = 'requested' THEN 1 END) as requested,
        COUNT(CASE WHEN o.connection_status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN o.connection_status = 'declined' THEN 1 END) as declined,
        COUNT(CASE WHEN o.connection_status IS NULL OR o.connection_status = 'none' THEN 1 END) as not_contacted
      FROM profiles p
      LEFT JOIN outreach o ON p.id = o.profile_id;
    `;

    const pool = require('../config/database');
    const result = await pool.query(query);
    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        totalProfiles: parseInt(stats.total_profiles),
        requested: parseInt(stats.requested),
        accepted: parseInt(stats.accepted),
        declined: parseInt(stats.declined),
        notContacted: parseInt(stats.not_contacted)
      }
    });

  } catch (error) {
    console.error('Get connection stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve connection statistics',
      message: error.message
    });
  }
});

// Add note to a connection
router.post('/add-note', async (req, res) => {
  try {
    const { profileId, note } = req.body;

    if (!profileId || !note) {
      return res.status(400).json({
        error: 'Missing required fields: profileId, note'
      });
    }

    const query = `
      UPDATE outreach 
      SET notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN $1
        ELSE notes || '\n---\n' || $1
      END
      WHERE profile_id = $2
      RETURNING *;
    `;

    const pool = require('../config/database');
    const result = await pool.query(query, [note.trim(), profileId]);

    if (result.rows.length === 0) {
      // Create outreach record if it doesn't exist
      const createQuery = `
        INSERT INTO outreach (profile_id, notes)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const createResult = await pool.query(createQuery, [profileId, note.trim()]);
      
      res.json({
        success: true,
        outreach: createResult.rows[0],
        message: 'Note added successfully'
      });
    } else {
      res.json({
        success: true,
        outreach: result.rows[0],
        message: 'Note added successfully'
      });
    }

  } catch (error) {
    console.error('Add connection note error:', error);
    res.status(500).json({
      error: 'Failed to add note',
      message: error.message
    });
  }
});

module.exports = router;
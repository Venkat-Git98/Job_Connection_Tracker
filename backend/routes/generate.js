const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const databaseService = require('../services/databaseService');

router.post('/connection', async (req, res) => {
  try {
    const { targetProfile } = req.body;

    if (!targetProfile) {
      return res.status(400).json({
        error: 'Missing required field: targetProfile'
      });
    }

    // Validate required profile fields
    if (!targetProfile.personName && !targetProfile.currentTitle) {
      return res.status(400).json({
        error: 'Target profile must have at least personName or currentTitle'
      });
    }

    // Generate connection request using Gemini
    const connectionRequest = await geminiService.generateConnectionRequest(targetProfile);

    // If we have a profile URL, try to store the outreach record
    let outreachRecord = null;
    if (targetProfile.profileUrl) {
      try {
        // First, find or create the profile
        const profile = await databaseService.upsertProfile(targetProfile);
        
        // Create outreach record
        outreachRecord = await databaseService.createOutreach(profile.id, connectionRequest);
      } catch (dbError) {
        console.error('Failed to store outreach record:', dbError);
        // Continue anyway, don't fail the request
      }
    }

    res.json({
      success: true,
      connectionRequest,
      targetProfile: {
        name: targetProfile.personName,
        title: targetProfile.currentTitle,
        company: targetProfile.currentCompany
      },
      outreachId: outreachRecord?.id,
      message: 'Connection request generated successfully'
    });

  } catch (error) {
    console.error('Connection generation error:', error);
    res.status(500).json({
      error: 'Failed to generate connection request',
      message: error.message
    });
  }
});

// Get personal profile for customization
router.get('/profile', (req, res) => {
  try {
    const profile = geminiService.getPersonalProfile();
    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error getting personal profile:', error);
    res.status(500).json({
      error: 'Failed to get personal profile',
      message: error.message
    });
  }
});

// Update personal profile
router.post('/profile', (req, res) => {
  try {
    const { profileData } = req.body;
    
    if (!profileData) {
      return res.status(400).json({
        error: 'Missing required field: profileData'
      });
    }

    geminiService.updatePersonalProfile(profileData);
    
    res.json({
      success: true,
      profile: geminiService.getPersonalProfile(),
      message: 'Personal profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating personal profile:', error);
    res.status(500).json({
      error: 'Failed to update personal profile',
      message: error.message
    });
  }
});

module.exports = router;
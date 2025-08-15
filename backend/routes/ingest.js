const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const extractionService = require('../services/extractionService');

router.post('/page', async (req, res) => {
  try {
    const { classification, url, extractedData, pageTitle, pageContent } = req.body;

    if (!classification || !url || !extractedData) {
      return res.status(400).json({
        error: 'Missing required fields: classification, url, extractedData'
      });
    }

    // Verify classification matches the data
    const detectedType = extractionService.classifyPageType(url, pageTitle, pageContent);
    const finalClassification = classification === 'unknown' ? detectedType : classification;

    let result;

    if (finalClassification === 'linkedin_profile') {
      // Normalize and validate profile data
      const normalizedData = extractionService.normalizeProfileData(extractedData);
      const { error, value } = extractionService.validateProfileData(normalizedData);
      
      if (error) {
        return res.status(400).json({
          error: 'Invalid profile data',
          details: error.details.map(d => d.message)
        });
      }

      // Store profile in database
      result = await databaseService.upsertProfile(value, req.user.id);
      
      res.json({
        success: true,
        type: 'profile',
        data: result,
        message: 'Profile data stored successfully'
      });

    } else if (finalClassification === 'job_application') {
      console.log('💼 Processing job application data:', extractedData);
      
      // Normalize and validate job data
      const normalizedData = extractionService.normalizeJobData(extractedData);
      console.log('🔧 Normalized job data:', normalizedData);
      
      const { error, value } = extractionService.validateJobData(normalizedData);
      
      if (error) {
        console.error('❌ Job data validation failed:', error.details);
        return res.status(400).json({
          error: 'Invalid job data',
          details: error.details.map(d => d.message),
          receivedData: extractedData,
          normalizedData: normalizedData
        });
      }

      console.log('✅ Job data validated successfully:', value);

      // Store job in database
      result = await databaseService.upsertJob(value, req.user.id);
      console.log('💾 Job stored in database:', result);
      
      res.json({
        success: true,
        type: 'job',
        data: result,
        message: 'Job data stored successfully'
      });

    } else {
      res.json({
        success: false,
        type: 'unknown',
        message: 'Page type could not be determined',
        classification: finalClassification,
        url: url
      });
    }

  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({
      error: 'Failed to process page data',
      message: error.message
    });
  }
});

module.exports = router;
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

    } else if (finalClassification === 'linkedin_company') {
      console.log('🏢 Processing LinkedIn company data:', extractedData);
      
      // Normalize and validate company data
      const normalizedData = extractionService.normalizeCompanyData(extractedData);
      console.log('🔧 Normalized company data:', normalizedData);
      
      const { error, value } = extractionService.validateCompanyData(normalizedData);
      
      if (error) {
        console.error('❌ Company data validation failed:', error.details);
        return res.status(400).json({
          error: 'Invalid company data',
          details: error.details.map(d => d.message),
          receivedData: extractedData,
          normalizedData: normalizedData
        });
      }

      console.log('✅ Company data validated successfully:', value);

      // Add company directly to database
      try {
        const pool = require('../config/database');
        
        // Helper function to check if user_id column exists
        async function checkUserIdColumn(pool, tableName) {
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
        
        const hasUserIdColumn = await checkUserIdColumn(pool, 'profiles');
        const companyName = value.companyName;
        
        // Check if company already exists
        const checkQuery = hasUserIdColumn ? `
          SELECT COUNT(*) as count 
          FROM profiles 
          WHERE current_company ILIKE $1 AND user_id = $2;
        ` : `
          SELECT COUNT(*) as count 
          FROM profiles 
          WHERE current_company ILIKE $1;
        `;

        const checkParams = hasUserIdColumn ? [companyName, req.user?.id || 1] : [companyName];
        const checkResult = await pool.query(checkQuery, checkParams);
        
        if (parseInt(checkResult.rows[0].count) > 0) {
          console.log('⚠️ Company already exists:', companyName);
          return res.json({
            success: true,
            type: 'company',
            data: { company: { name: companyName }, ...value },
            message: `Company "${companyName}" already exists in your tracking list`
          });
        }

        // Create a placeholder profile for the company
        const insertQuery = hasUserIdColumn ? `
          INSERT INTO profiles (
            person_name, profile_url, current_company, headline, last_seen_at, user_id
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
          RETURNING *;
        ` : `
          INSERT INTO profiles (
            person_name, profile_url, current_company, headline, last_seen_at
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          RETURNING *;
        `;

        const placeholderUrl = value.companyUrl || `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`;
        const insertParams = hasUserIdColumn ? [
          `${companyName} - Company Placeholder`,
          placeholderUrl,
          companyName,
          'Company placeholder for tracking purposes',
          req.user?.id || 1
        ] : [
          `${companyName} - Company Placeholder`,
          placeholderUrl,
          companyName,
          'Company placeholder for tracking purposes'
        ];
        
        const dbResult = await pool.query(insertQuery, insertParams);
        console.log('💾 Company added successfully:', dbResult.rows[0]);
        
        res.json({
          success: true,
          type: 'company',
          data: {
            company: {
              name: companyName,
              profileId: dbResult.rows[0].id
            },
            ...value
          },
          message: `Company "${companyName}" added successfully`
        });
        
      } catch (dbError) {
        console.error('❌ Failed to add company:', dbError);
        res.status(500).json({
          error: 'Failed to add company to database',
          message: dbError.message
        });
      }

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
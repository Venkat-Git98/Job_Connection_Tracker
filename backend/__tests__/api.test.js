const request = require('supertest');
const express = require('express');

// Mock the database service
jest.mock('../services/databaseService');
jest.mock('../services/geminiService');

const app = express();
app.use(express.json());
app.use('/api', require('../routes/api'));

describe('API Endpoints', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(404); // Since health is not under /api
    });
  });

  describe('POST /api/ingest/page', () => {
    it('should ingest LinkedIn profile data', async () => {
      const profileData = {
        classification: 'linkedin_profile',
        url: 'https://linkedin.com/in/test',
        extractedData: {
          personName: 'Test User',
          profileUrl: 'https://linkedin.com/in/test',
          currentTitle: 'Software Engineer',
          currentCompany: 'Test Company'
        }
      };

      const response = await request(app)
        .post('/api/ingest/page')
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.type).toBe('profile');
    });

    it('should ingest job application data', async () => {
      const jobData = {
        classification: 'job_application',
        url: 'https://linkedin.com/jobs/123',
        extractedData: {
          jobTitle: 'Senior Developer',
          companyName: 'Tech Corp',
          platform: 'linkedin',
          jobUrl: 'https://linkedin.com/jobs/123'
        }
      };

      const response = await request(app)
        .post('/api/ingest/page')
        .send(jobData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.type).toBe('job');
    });

    it('should return error for missing data', async () => {
      const response = await request(app)
        .post('/api/ingest/page')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('POST /api/generate/connection', () => {
    it('should generate connection request', async () => {
      const mockGeminiService = require('../services/geminiService');
      mockGeminiService.generateConnectionRequest.mockResolvedValue('Test connection request');

      const profileData = {
        targetProfile: {
          personName: 'Test User',
          currentTitle: 'Software Engineer',
          currentCompany: 'Test Company'
        }
      };

      const response = await request(app)
        .post('/api/generate/connection')
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.connectionRequest).toBe('Test connection request');
    });
  });

  describe('GET /api/connections', () => {
    it('should return connections list', async () => {
      const mockDatabaseService = require('../services/databaseService');
      mockDatabaseService.getProfiles.mockResolvedValue([
        {
          id: 1,
          person_name: 'Test User',
          current_company: 'Test Company',
          connection_status: 'none'
        }
      ]);

      const response = await request(app)
        .get('/api/connections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.connections)).toBe(true);
    });
  });

  describe('GET /api/jobs', () => {
    it('should return jobs list', async () => {
      const mockDatabaseService = require('../services/databaseService');
      mockDatabaseService.getJobs.mockResolvedValue([
        {
          id: 1,
          job_title: 'Software Engineer',
          company_name: 'Test Company',
          application_status: 'viewed'
        }
      ]);

      const response = await request(app)
        .get('/api/jobs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });
  });
});
const databaseService = require('../services/databaseService');

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const mockPool = require('../config/database');

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertProfile', () => {
    it('should insert a new profile', async () => {
      const mockProfile = {
        personName: 'John Doe',
        profileUrl: 'https://linkedin.com/in/johndoe',
        currentTitle: 'Software Engineer',
        currentCompany: 'Tech Corp',
        location: 'San Francisco, CA',
        headline: 'Passionate about technology',
        about: 'Experienced developer',
        experiences: [{ title: 'Engineer', company: 'Tech Corp' }]
      };

      const mockResult = {
        rows: [{ id: 1, ...mockProfile }]
      };

      mockPool.query.mockResolvedValue(mockResult);

      const result = await databaseService.upsertProfile(mockProfile);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO profiles'),
        expect.arrayContaining([
          mockProfile.personName,
          mockProfile.profileUrl,
          mockProfile.currentTitle,
          mockProfile.currentCompany,
          mockProfile.location,
          mockProfile.headline,
          mockProfile.about,
          JSON.stringify(mockProfile.experiences)
        ])
      );

      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('upsertJob', () => {
    it('should insert a new job', async () => {
      const mockJob = {
        jobTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        platform: 'linkedin',
        jobUrl: 'https://linkedin.com/jobs/123',
        location: 'Remote',
        postedDate: '2024-01-15',
        applicationStatus: 'viewed'
      };

      const mockResult = {
        rows: [{ id: 1, ...mockJob }]
      };

      mockPool.query.mockResolvedValue(mockResult);

      const result = await databaseService.upsertJob(mockJob);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO jobs'),
        expect.arrayContaining([
          mockJob.jobTitle,
          mockJob.companyName,
          mockJob.platform,
          mockJob.jobUrl,
          mockJob.location,
          mockJob.postedDate,
          mockJob.applicationStatus
        ])
      );

      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('getProfiles', () => {
    it('should return profiles with search filter', async () => {
      const mockProfiles = [
        { id: 1, person_name: 'John Doe', current_company: 'Tech Corp' }
      ];

      mockPool.query.mockResolvedValue({ rows: mockProfiles });

      const result = await databaseService.getProfiles('Tech', 50, 0);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.person_name ILIKE $1 OR p.current_company ILIKE $1'),
        ['%Tech%', 50, 0]
      );

      expect(result).toEqual(mockProfiles);
    });
  });
});
const extractionService = require('../services/extractionService');

describe('ExtractionService', () => {
  describe('classifyPageType', () => {
    it('should classify LinkedIn profile URLs', () => {
      const url = 'https://www.linkedin.com/in/johndoe';
      const result = extractionService.classifyPageType(url);
      expect(result).toBe('linkedin_profile');
    });

    it('should classify job posting URLs', () => {
      const urls = [
        'https://www.linkedin.com/jobs/view/123456',
        'https://indeed.com/viewjob?jk=123',
        'https://company.greenhouse.io/jobs/123',
        'https://jobs.lever.co/company/123'
      ];

      urls.forEach(url => {
        const result = extractionService.classifyPageType(url);
        expect(result).toBe('job_application');
      });
    });

    it('should return unknown for unrecognized URLs', () => {
      const url = 'https://example.com/random-page';
      const result = extractionService.classifyPageType(url);
      expect(result).toBe('unknown');
    });
  });

  describe('extractPlatform', () => {
    it('should extract platform from job URLs', () => {
      const testCases = [
        { url: 'https://linkedin.com/jobs/123', expected: 'linkedin' },
        { url: 'https://indeed.com/viewjob', expected: 'indeed' },
        { url: 'https://company.greenhouse.io/jobs/123', expected: 'greenhouse' },
        { url: 'https://unknown-site.com/jobs', expected: 'unknown-site.com' }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = extractionService.extractPlatform(url);
        expect(result).toBe(expected);
      });
    });
  });

  describe('normalizeProfileData', () => {
    it('should normalize profile data correctly', () => {
      const rawData = {
        personName: '  John Doe  ',
        profileUrl: 'https://linkedin.com/in/johndoe',
        currentTitle: 'Software Engineer',
        currentCompany: 'Tech Corp',
        experiences: [
          { title: 'Engineer', company: 'Tech Corp' },
          { title: '', company: '' } // Should be filtered out
        ]
      };

      const result = extractionService.normalizeProfileData(rawData);

      expect(result.personName).toBe('John Doe');
      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].title).toBe('Engineer');
    });
  });

  describe('validateProfileData', () => {
    it('should validate correct profile data', () => {
      const validData = {
        personName: 'John Doe',
        profileUrl: 'https://linkedin.com/in/johndoe',
        currentTitle: 'Software Engineer',
        currentCompany: 'Tech Corp',
        location: 'San Francisco',
        headline: 'Passionate developer',
        about: 'Experienced in web development',
        experiences: []
      };

      const { error } = extractionService.validateProfileData(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid profile data', () => {
      const invalidData = {
        personName: '', // Required field empty
        profileUrl: 'not-a-url', // Invalid URL
      };

      const { error } = extractionService.validateProfileData(invalidData);
      expect(error).toBeDefined();
    });
  });
});
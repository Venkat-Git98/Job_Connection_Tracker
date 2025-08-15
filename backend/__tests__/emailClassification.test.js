const emailClassificationService = require('../services/emailClassificationService');
const gmailImapService = require('../services/gmailImapService');

describe('Email Classification Service', () => {
  describe('Pattern-based Classification', () => {
    test('should correctly identify newsletter emails as non-job-related', () => {
      const newsletterEmail = {
        subject: 'Careerflow.ai August Update for Job Seekers',
        from: 'updates@careerflow.ai',
        text: `Hi Venkatesh, I'm beyond excited to announce that over ONE MILLION users (including you, yes YOU!) have now used Careerflow.ai to land their dream roles! Our mission has always been to make the job search process more efficient, and seeing so many of you succeed proves we're on the right track. Thank you for being a part of this fantastic journey!

Open Roles at Top AI Companies
We have some interesting remote job openings for experienced professionals to help train AI models for one of the world's top research labs. It's a remote opportunity with competitive hourly pay. Apply now if you're ready to shine!

Senior Finance Expert (Top-tier firms) ($90-$100/hr)
Senior Insurance Leaders ($75-100/hr)
Finance Expert ($77/hr)
Social Media Writers/Bloggers/Written Content Creators ($50/hr)

Know someone who's perfect for the role? Refer them (you'll get a referral bonus too!).

Product Updates
New Base vs Job-Tailored Resume
We've rolled out a significant update on our popular Resume Builder...`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(newsletterEmail);
      expect(isObviouslyNotJobRelated).toBe(true);
    });

    test('should correctly identify research newsletter as non-job-related', () => {
      const researchEmail = {
        subject: 'SCSP Newsletter - Strategic Studies',
        from: 'newsletter@scsp.org',
        text: `Hello, I'm Ylli Bajraktari, CEO of the Special Competitive Studies Project. In this special edition of SCSP's newsletter, we continue our ISF Voices series. Launched earlier this year, ISF Voices showcases writing by current fellows in SCSP's International Strategy Forum (ISF) program. Each piece reflects the unique vantage points of emerging leaders from around the world working to shape the future of geopolitics, technology, and democracy.

Today, we're proud to feature Fausto Carbajal Glass, a 2025 ISF Fellow and Ph.D. candidate at the Mexican Institute for Strategic Studies in National Security and Defense (IMEESDN), as well as founder of Delphi Solutions and Strategic Services. In his writing, Fausto explores how the evolving U.S.–China strategic competition is reshaping supply chain strategies—and how Mexico, through targeted policy and institutional alignment under the United States-Mexico-Canada Agreement, can play a pivotal role in bolstering North America's overall resilience and competitiveness.`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(researchEmail);
      expect(isObviouslyNotJobRelated).toBe(true);
    });

    test('should correctly identify job rejection email', () => {
      const rejectionEmail = {
        subject: 'Thank you for your interest - Software Engineer Position',
        from: 'hr@techcompany.com',
        text: `Dear Venkatesh,

Thank you for your interest in the Software Engineer position at TechCompany. After careful consideration of your application and qualifications, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.

We were impressed by your background and encourage you to apply for future opportunities that may be a better fit.

Best regards,
HR Team
TechCompany`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(rejectionEmail);
      expect(isObviouslyNotJobRelated).toBe(false);

      const analysis = gmailImapService.classifyWithAdvancedPatterns(rejectionEmail);
      expect(analysis).toBeTruthy();
      expect(analysis.type).toBe('rejection');
      expect(analysis.confidence).toBeGreaterThan(80);
    });

    test('should correctly identify technical assessment email', () => {
      const assessmentEmail = {
        subject: 'Next Steps: Technical Assessment - Senior Developer Role',
        from: 'recruiting@startup.com',
        text: `Hi Venkatesh,

Thank you for your application for the Senior Developer position. We'd like to move forward with the next step in our process.

Please complete the coding challenge using the link below. You'll have 48 hours to complete it once you start.

Assessment Link: https://codility.com/test/ABC123
Deadline: Complete by Friday, August 18th

The assessment covers algorithms, data structures, and system design. Please let me know if you have any questions.

Best,
Sarah Johnson
Technical Recruiter`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(assessmentEmail);
      expect(isObviouslyNotJobRelated).toBe(false);

      const analysis = gmailImapService.classifyWithAdvancedPatterns(assessmentEmail);
      expect(analysis).toBeTruthy();
      expect(analysis.type).toBe('assessment');
      expect(analysis.confidence).toBeGreaterThan(80);
      expect(analysis.assessmentLink).toContain('codility.com');
    });

    test('should correctly identify interview invitation', () => {
      const interviewEmail = {
        subject: 'Interview Invitation - Machine Learning Engineer',
        from: 'talent@aicompany.com',
        text: `Dear Venkatesh,

We were impressed with your application for the Machine Learning Engineer position and would like to schedule an interview with you.

Are you available for a 45-minute video interview next week? Please let me know your availability for:
- Tuesday, August 22nd between 2-5 PM
- Wednesday, August 23rd between 10 AM - 3 PM
- Thursday, August 24th between 1-4 PM

The interview will cover your experience with ML models, Python, and system architecture.

Looking forward to speaking with you!

Best regards,
Mike Chen
Hiring Manager`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(interviewEmail);
      expect(isObviouslyNotJobRelated).toBe(false);

      const analysis = gmailImapService.classifyWithAdvancedPatterns(interviewEmail);
      expect(analysis).toBeTruthy();
      expect(analysis.type).toBe('interview_invite');
      expect(analysis.confidence).toBeGreaterThan(80);
    });

    test('should correctly identify job offer email', () => {
      const offerEmail = {
        subject: 'Job Offer - Senior Software Engineer Position',
        from: 'hr@greatcompany.com',
        text: `Dear Venkatesh,

Congratulations! We are pleased to offer you the position of Senior Software Engineer at GreatCompany.

Offer Details:
- Base Salary: $150,000 annually
- Signing Bonus: $10,000
- Equity: 0.1% stock options
- Start Date: September 4th, 2025

Please review the attached offer letter and let us know your decision by August 25th.

We're excited about the possibility of you joining our team!

Best regards,
Jennifer Smith
VP of Engineering`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(offerEmail);
      expect(isObviouslyNotJobRelated).toBe(false);

      const analysis = gmailImapService.classifyWithAdvancedPatterns(offerEmail);
      expect(analysis).toBeTruthy();
      expect(analysis.type).toBe('offer');
      expect(analysis.confidence).toBeGreaterThan(90);
    });
  });

  describe('Sender Analysis', () => {
    test('should identify recruiting platform emails', () => {
      const greenhouseEmail = {
        subject: 'Application Update',
        from: 'noreply@greenhouse.io',
        text: 'Your application status has been updated.'
      };

      const senderAnalysis = gmailImapService.analyzeSender(greenhouseEmail);
      expect(senderAnalysis.type).toBe('ats_platform');
      expect(senderAnalysis.score).toBeGreaterThan(80);
      expect(senderAnalysis.isRecruitingRelated).toBe(true);
    });

    test('should identify HR team emails', () => {
      const hrEmail = {
        subject: 'Interview Confirmation',
        from: 'hr@company.com',
        text: 'Please confirm your interview time.'
      };

      const senderAnalysis = gmailImapService.analyzeSender(hrEmail);
      expect(senderAnalysis.type).toBe('hr_team');
      expect(senderAnalysis.score).toBeGreaterThan(80);
      expect(senderAnalysis.isRecruitingRelated).toBe(true);
    });

    test('should identify generic email providers', () => {
      const genericEmail = {
        subject: 'Newsletter',
        from: 'updates@gmail.com',
        text: 'Generic newsletter content.'
      };

      const senderAnalysis = gmailImapService.analyzeSender(genericEmail);
      expect(senderAnalysis.type).toBe('generic');
      expect(senderAnalysis.score).toBeLessThan(30);
      expect(senderAnalysis.isRecruitingRelated).toBe(false);
    });
  });

  describe('Context Analysis', () => {
    test('should identify personalized content', () => {
      const personalizedEmail = {
        subject: 'Your Application - Software Engineer',
        from: 'recruiter@company.com',
        text: `Dear Venkatesh,

Thank you for your application for the Software Engineer position. We reviewed your resume and are impressed with your experience in machine learning and computer vision.

We would like to schedule a phone interview to discuss your background further.

Best regards,
Jane Doe
Senior Recruiter`
      };

      const contextAnalysis = gmailImapService.analyzeEmailContext(personalizedEmail);
      expect(contextAnalysis.indicators.personalizedContent).toBe(true);
      expect(contextAnalysis.indicators.hasApplicationReference).toBe(true);
      expect(contextAnalysis.indicators.hasJobTitle).toBe(true);
      expect(contextAnalysis.score).toBeGreaterThan(50);
      expect(contextAnalysis.isPersonalized).toBe(true);
    });

    test('should identify generic/automated content', () => {
      const genericEmail = {
        subject: 'Weekly Job Digest',
        from: 'noreply@jobsite.com',
        text: 'Here are this week\'s top job opportunities in your area.'
      };

      const contextAnalysis = gmailImapService.analyzeEmailContext(genericEmail);
      expect(contextAnalysis.indicators.personalizedContent).toBe(false);
      expect(contextAnalysis.indicators.hasApplicationReference).toBe(false);
      expect(contextAnalysis.score).toBeLessThan(30);
      expect(contextAnalysis.isPersonalized).toBe(false);
    });
  });

  describe('Combined Analysis', () => {
    test('should combine multiple analyses correctly', () => {
      const jobEmail = {
        subject: 'Technical Assessment - ML Engineer Position',
        from: 'recruiting@aicompany.com',
        text: `Dear Venkatesh,

Thank you for your application for the Machine Learning Engineer position at AICompany. 

We would like you to complete a technical assessment to evaluate your coding skills. Please use the link below to access the test:

https://hackerrank.com/test/xyz123

You have 3 days to complete the assessment. Please let me know if you have any questions.

Best regards,
Alex Thompson
Technical Recruiter
AICompany`
      };

      const patternAnalysis = gmailImapService.classifyWithAdvancedPatterns(jobEmail);
      const contextAnalysis = gmailImapService.analyzeEmailContext(jobEmail);
      const senderAnalysis = gmailImapService.analyzeSender(jobEmail);

      const combinedAnalysis = gmailImapService.combineAnalyses(patternAnalysis, contextAnalysis, senderAnalysis);

      expect(combinedAnalysis).toBeTruthy();
      expect(combinedAnalysis.type).toBe('assessment');
      expect(combinedAnalysis.confidence).toBeGreaterThan(85);
      expect(combinedAnalysis.isJobRelated).toBe(true);
      expect(combinedAnalysis.senderAnalysis.isRecruitingRelated).toBe(true);
      expect(combinedAnalysis.contextAnalysis.isPersonalized).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle emails with mixed content', () => {
      const mixedEmail = {
        subject: 'Company Newsletter - New Opportunities',
        from: 'newsletter@company.com',
        text: `Welcome to our monthly newsletter!

Company Updates:
- We've launched a new product
- Our team is growing rapidly

Job Opportunities:
We're hiring for several positions including Software Engineers and Data Scientists. Visit our careers page to learn more.

Industry News:
The tech industry continues to evolve...`
      };

      const isObviouslyNotJobRelated = gmailImapService.isObviouslyNotJobRelated(mixedEmail);
      expect(isObviouslyNotJobRelated).toBe(true); // Should be filtered out as newsletter
    });

    test('should handle very short emails', () => {
      const shortEmail = {
        subject: 'Re: Application',
        from: 'hr@company.com',
        text: 'Thanks for applying. We\'ll be in touch.'
      };

      const contextAnalysis = gmailImapService.analyzeEmailContext(shortEmail);
      expect(contextAnalysis.score).toBeLessThan(50); // Penalized for being too short
    });

    test('should handle very long emails', () => {
      const longEmail = {
        subject: 'Detailed Company Information',
        from: 'info@company.com',
        text: 'A'.repeat(6000) // Very long email
      };

      const contextAnalysis = gmailImapService.analyzeEmailContext(longEmail);
      expect(contextAnalysis.score).toBeLessThan(50); // Penalized for being too long
    });
  });
});

describe('Email Classification Statistics', () => {
  test('should track classification statistics', () => {
    const stats = emailClassificationService.getClassificationStats();
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('byType');
    expect(stats).toHaveProperty('byDomain');
    expect(stats).toHaveProperty('averageConfidence');
    expect(stats).toHaveProperty('recentClassifications');
    
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.byType).toBe('object');
    expect(typeof stats.byDomain).toBe('object');
    expect(typeof stats.averageConfidence).toBe('number');
    expect(Array.isArray(stats.recentClassifications)).toBe(true);
  });
});
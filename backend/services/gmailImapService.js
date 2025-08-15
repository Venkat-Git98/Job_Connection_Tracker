const Imap = require('imap');
const { simpleParser } = require('mailparser');
const geminiService = require('./geminiService');
const databaseService = require('./databaseService');
const emailClassificationService = require('./emailClassificationService');

class GmailImapService {
  constructor() {
    this.imap = null;
    this.isConnected = false;
    this.lastCheckedDate = new Date();
    this.monitoringInterval = null;
    this.processedEmails = new Set(); // Track processed email IDs to prevent duplicates
    
    // IMAP configuration
    this.config = {
      user: process.env.GMAIL_EMAIL,
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.config);
      
      this.imap.once('ready', () => {
        console.log('✅ Gmail IMAP connection established');
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('❌ Gmail IMAP connection error:', err);
        this.isConnected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('📪 Gmail IMAP connection ended');
        this.isConnected = false;
      });

      this.imap.connect();
    });
  }

  async disconnect() {
    if (this.imap && this.isConnected) {
      this.imap.end();
    }
  }

  async checkForJobEmails() {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for emails since last check
        const searchCriteria = [
          'UNSEEN', // Only unread emails
          ['SINCE', this.lastCheckedDate]
        ];

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('📭 No new emails found');
            resolve([]);
            return;
          }

          console.log(`📬 Found ${results.length} new emails`);
          this.processEmails(results).then(resolve).catch(reject);
        });
      });
    });
  }

  async processEmails(emailIds) {
    const jobEmails = [];

    return new Promise((resolve, reject) => {
      const fetch = this.imap.fetch(emailIds, {
        bodies: '',
        struct: true
      });

      fetch.on('message', (msg, seqno) => {
        let emailData = {};

        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });

          stream.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              emailData = {
                subject: parsed.subject,
                from: parsed.from?.text || '',
                to: parsed.to?.text || '',
                date: parsed.date,
                text: parsed.text || '',
                html: parsed.html || '',
                messageId: parsed.messageId
              };

              // Skip if we've already processed this email
              const emailKey = `${emailData.messageId || emailData.subject}_${emailData.from}_${emailData.date}`;
              if (this.processedEmails.has(emailKey)) {
                console.log(`📧 Skipping already processed email: ${emailData.subject}`);
                return;
              }

              // Check if this is a job-related email
              const jobInfo = await this.analyzeJobEmail(emailData);
              if (jobInfo) {
                // Mark as processed
                this.processedEmails.add(emailKey);
                
                jobEmails.push(jobInfo);
                await this.processJobEmail(jobInfo, emailData);
              }
            } catch (error) {
              console.error('Error parsing email:', error);
            }
          });
        });

        msg.once('attributes', (attrs) => {
          emailData.uid = attrs.uid;
          emailData.flags = attrs.flags;
        });
      });

      fetch.once('error', reject);
      fetch.once('end', () => {
        this.lastCheckedDate = new Date();
        resolve(jobEmails);
      });
    });
  }

  async analyzeJobEmail(emailData) {
    const { subject, from, text } = emailData;
    
    // First, quick check if this is obviously not job-related
    const isObviouslyNotJobRelated = this.isObviouslyNotJobRelated(emailData);
    if (isObviouslyNotJobRelated) {
      console.log(`📧 Skipping obvious non-job email: ${subject}`);
      return null;
    }
    
    // Use pattern-based analysis first
    const patternAnalysis = this.classifyWithAdvancedPatterns(emailData);
    const contextAnalysis = this.analyzeEmailContext(emailData);
    const senderAnalysis = this.analyzeSender(emailData);
    
    // Combine pattern analyses
    const combinedPatternResult = this.combineAnalyses(patternAnalysis, contextAnalysis, senderAnalysis);
    
    // Use hybrid classification (AI + patterns)
    const finalAnalysis = await emailClassificationService.hybridClassification(emailData, combinedPatternResult);
    
    if (finalAnalysis) {
      console.log(`✅ Email classified as ${finalAnalysis.type} with ${finalAnalysis.confidence}% confidence`);
    }
    
    return finalAnalysis;
  }

  // Quick check to filter out obviously non-job-related emails
  isObviouslyNotJobRelated(emailData) {
    const { subject, from, text } = emailData;
    const content = `${subject} ${text}`.toLowerCase();
    const fromDomain = this.extractDomain(from);
    
    // Strong indicators this is NOT a job-related email
    const strongExcludePatterns = [
      // Newsletter patterns
      /newsletter/i,
      /unsubscribe/i,
      /view.*in.*browser/i,
      /weekly.*digest/i,
      /monthly.*update/i,
      /daily.*brief/i,
      
      // Marketing patterns
      /marketing@/i,
      /noreply@/i,
      /no-reply@/i,
      /newsletter@/i,
      /updates@/i,
      /news@/i,
      /promo/i,
      /promotion/i,
      /sale/i,
      /discount/i,
      /deal/i,
      /offer.*expires/i,
      /limited.*time/i,
      /act.*now/i,
      
      // Educational/Content patterns
      /blog.*post/i,
      /article/i,
      /webinar/i,
      /course/i,
      /training/i,
      /learn/i,
      /tutorial/i,
      /guide/i,
      /tips/i,
      /best.*practices/i,
      
      // Event patterns
      /event.*invitation/i,
      /conference/i,
      /meetup/i,
      /workshop/i,
      /seminar/i,
      
      // Survey/Feedback patterns
      /survey/i,
      /feedback/i,
      /review.*request/i,
      /rate.*experience/i,
      
      // Company update patterns
      /company.*update/i,
      /product.*update/i,
      /feature.*update/i,
      /announcement/i,
      /press.*release/i,
      /new.*feature/i,
      
      // Generic job board patterns (not specific applications)
      /job.*alert/i,
      /new.*jobs/i,
      /recommended.*jobs/i,
      /jobs.*matching/i,
      /career.*opportunities/i,
      /hiring.*now/i
    ];
    
    // Check if it matches strong exclusion patterns
    const hasStrongExclusionPattern = strongExcludePatterns.some(pattern => 
      pattern.test(content) || pattern.test(from)
    );
    
    if (hasStrongExclusionPattern) {
      return true; // This is obviously not job-related
    }
    
    // Check for obvious marketing domains
    const marketingDomains = [
      'mailchimp.com', 'constantcontact.com', 'sendgrid.net',
      'mailgun.org', 'amazonses.com', 'sparkpost.com'
    ];
    
    const fromDomain = this.extractDomain(from);
    if (marketingDomains.some(domain => fromDomain.includes(domain))) {
      return true; // Marketing email
    }
    
    return false; // Might be job-related, continue analysis
  }

  // Enhanced sender analysis
  analyzeSender(emailData) {
    const { from } = emailData;
    const fromDomain = this.extractDomain(from);
    const fromEmail = from.toLowerCase();
    
    // Known recruiting platforms and ATS systems
    const recruitingDomains = [
      'greenhouse.io', 'lever.co', 'workday.com', 'bamboohr.com',
      'smartrecruiters.com', 'jobvite.com', 'icims.com', 'taleo.net',
      'successfactors.com', 'cornerstone.com', 'indeed.com', 'linkedin.com'
    ];
    
    // HR/Recruiting email patterns
    const hrPatterns = [
      /hr@/i, /recruiting@/i, /talent@/i, /careers@/i, /jobs@/i,
      /hiring@/i, /recruitment@/i, /people@/i, /staffing@/i
    ];
    
    let senderScore = 0;
    let senderType = 'unknown';
    
    if (recruitingDomains.some(domain => fromDomain.includes(domain))) {
      senderScore = 90;
      senderType = 'ats_platform';
    } else if (hrPatterns.some(pattern => pattern.test(fromEmail))) {
      senderScore = 85;
      senderType = 'hr_team';
    } else if (fromEmail.includes('recruiter') || fromEmail.includes('talent')) {
      senderScore = 80;
      senderType = 'recruiter';
    } else if (fromDomain && !this.isGenericEmailProvider(fromDomain)) {
      senderScore = 60;
      senderType = 'company_email';
    } else {
      senderScore = 20;
      senderType = 'generic';
    }
    
    return {
      score: senderScore,
      type: senderType,
      domain: fromDomain,
      isRecruitingRelated: senderScore >= 60
    };
  }

  // Enhanced context analysis
  analyzeEmailContext(emailData) {
    const { subject, text } = emailData;
    const content = `${subject} ${text}`.toLowerCase();
    
    // Analyze email structure and content patterns
    const contextIndicators = {
      personalizedContent: this.hasPersonalizedContent(text),
      hasJobTitle: this.containsJobTitle(content),
      hasCompanyName: this.containsCompanyName(content),
      hasApplicationReference: this.hasApplicationReference(content),
      hasActionItems: this.hasActionItems(content),
      emailLength: text.length,
      hasSignature: this.hasEmailSignature(text)
    };
    
    let contextScore = 0;
    
    if (contextIndicators.personalizedContent) contextScore += 20;
    if (contextIndicators.hasJobTitle) contextScore += 15;
    if (contextIndicators.hasCompanyName) contextScore += 10;
    if (contextIndicators.hasApplicationReference) contextScore += 25;
    if (contextIndicators.hasActionItems) contextScore += 15;
    if (contextIndicators.hasSignature) contextScore += 10;
    
    // Penalize very short or very long emails (likely automated/newsletters)
    if (contextIndicators.emailLength < 100 || contextIndicators.emailLength > 5000) {
      contextScore -= 20;
    }
    
    return {
      score: Math.max(0, contextScore),
      indicators: contextIndicators,
      isPersonalized: contextScore >= 40
    };
  }

  // Combine multiple analyses
  combineAnalyses(patternAnalysis, contextAnalysis, senderAnalysis) {
    if (!patternAnalysis) return null;
    
    // Weighted scoring
    const patternWeight = 0.4;
    const contextWeight = 0.3;
    const senderWeight = 0.3;
    
    const combinedScore = 
      (patternAnalysis.confidence * patternWeight) +
      (contextAnalysis.score * contextWeight) +
      (senderAnalysis.score * senderWeight);
    
    // Adjust confidence based on sender credibility
    let adjustedConfidence = combinedScore;
    
    if (senderAnalysis.isRecruitingRelated) {
      adjustedConfidence += 10;
    }
    
    if (contextAnalysis.isPersonalized) {
      adjustedConfidence += 5;
    }
    
    return {
      ...patternAnalysis,
      confidence: Math.min(100, Math.max(0, adjustedConfidence)),
      senderAnalysis,
      contextAnalysis,
      isJobRelated: combinedScore >= 50
    };
  }

  // Helper methods for context analysis
  hasPersonalizedContent(text) {
    const personalizedPatterns = [
      /dear\s+[a-z]+/i,
      /hi\s+[a-z]+/i,
      /hello\s+[a-z]+/i,
      /thank you for your/i,
      /your application for/i,
      /we reviewed your/i
    ];
    return personalizedPatterns.some(pattern => pattern.test(text));
  }

  containsJobTitle(content) {
    const jobTitlePatterns = [
      /engineer/i, /developer/i, /manager/i, /analyst/i, /specialist/i,
      /designer/i, /architect/i, /lead/i, /director/i, /coordinator/i,
      /associate/i, /intern/i, /consultant/i, /administrator/i
    ];
    return jobTitlePatterns.some(pattern => pattern.test(content));
  }

  containsCompanyName(content) {
    // Look for company-specific patterns
    const companyPatterns = [
      /at\s+[A-Z][a-zA-Z\s&]+/,
      /join\s+[A-Z][a-zA-Z\s&]+/,
      /[A-Z][a-zA-Z\s&]+\s+team/
    ];
    return companyPatterns.some(pattern => pattern.test(content));
  }

  hasApplicationReference(content) {
    const applicationPatterns = [
      /application/i, /applied/i, /resume/i, /cv/i, /portfolio/i,
      /submission/i, /candidate/i, /applicant/i
    ];
    return applicationPatterns.some(pattern => pattern.test(content));
  }

  hasActionItems(content) {
    const actionPatterns = [
      /please/i, /complete/i, /schedule/i, /respond/i, /reply/i,
      /click/i, /visit/i, /download/i, /submit/i, /confirm/i
    ];
    return actionPatterns.some(pattern => pattern.test(content));
  }

  hasEmailSignature(text) {
    const signaturePatterns = [
      /best regards/i, /sincerely/i, /thank you/i, /cheers/i,
      /--\s*\n/m, /sent from/i, /this email/i
    ];
    return signaturePatterns.some(pattern => pattern.test(text));
  }

  isGenericEmailProvider(domain) {
    const genericProviders = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
    ];
    return genericProviders.some(provider => domain.includes(provider));
  }

  classifyWithAdvancedPatterns(emailData) {
    const { subject, from, text } = emailData;
    const content = `${subject} ${text}`.toLowerCase();
    const fromDomain = this.extractDomain(from);
    
    // Comprehensive pattern matching system with improved patterns
    const patterns = {
      // Application confirmations - more specific patterns
      application_confirmation: {
        patterns: [
          /thank you for your application/i,
          /application.*received/i,
          /we have received your application/i,
          /your application for.*has been received/i,
          /application submitted successfully/i,
          /confirmation.*application/i,
          /successfully submitted.*application/i
        ],
        confidence: 85,
        nextSteps: 'Wait for further communication from the company',
        requiredContext: ['application', 'position', 'role', 'job']
      },
      
      // Rejections - High confidence patterns with strict validation
      rejection: {
        patterns: [
          /unfortunately.*not moving forward/i,
          /decided to pursue other candidates/i,
          /position has been filled/i,
          /not selected.*position/i,
          /thank you for your interest.*however/i,
          /we will not be moving forward/i,
          /chosen to move forward with other candidates/i,
          /your application was not successful/i,
          /regret to inform you/i,
          /after careful consideration.*not proceed/i,
          /we have decided not to move forward/i,
          /will not be proceeding/i
        ],
        confidence: 95,
        nextSteps: 'No action required. Consider asking for feedback.',
        requiredContext: ['application', 'position', 'role', 'candidate'],
        excludePatterns: [/newsletter/i, /update/i, /announcement/i]
      },
      
      // Technical assessments - strict validation to avoid false positives
      assessment: {
        patterns: [
          /coding challenge/i,
          /technical assessment/i,
          /complete.*(?:test|assessment|challenge)/i,
          /hackerrank/i,
          /codility/i,
          /take.*(?:assessment|test|challenge)/i,
          /programming challenge/i,
          /technical evaluation/i,
          /coding exercise/i,
          /online assessment/i,
          /technical screening/i,
          /skills.*assessment/i,
          /technical.*interview.*test/i
        ],
        confidence: 90,
        nextSteps: 'Complete the technical assessment by the deadline',
        requiredContext: ['position', 'role', 'application', 'candidate', 'interview'],
        excludePatterns: [
          /newsletter/i, /blog/i, /article/i, /webinar/i, /course/i,
          /training/i, /learn/i, /education/i, /study/i, /research/i
        ]
      },
      
      // Interview invitations
      interview_invite: {
        patterns: [
          /schedule.*interview/i,
          /interview invitation/i,
          /next round/i,
          /would like to interview/i,
          /phone.*interview/i,
          /video.*interview/i,
          /interview.*scheduled/i,
          /meet.*discuss/i,
          /available.*interview/i,
          /interview.*opportunity/i
        ],
        confidence: 90,
        nextSteps: 'Respond to schedule the interview'
      },
      
      // Job offers - very strict validation
      offer: {
        patterns: [
          /job offer/i,
          /pleased to offer/i,
          /offer letter/i,
          /offer of employment/i,
          /congratulations.*(?:selected|chosen|offer)/i,
          /extend.*offer/i,
          /formal offer/i,
          /employment offer/i
        ],
        confidence: 95,
        nextSteps: 'Review the offer and respond accordingly',
        requiredContext: ['position', 'role', 'employment', 'salary', 'compensation'],
        excludePatterns: [
          /newsletter/i, /promotion/i, /discount/i, /sale/i, /deal/i,
          /special offer/i, /limited offer/i, /exclusive offer/i
        ]
      },
      
      // Follow-up requests
      followup_request: {
        patterns: [
          /following up/i,
          /checking in/i,
          /status.*application/i,
          /update.*application/i,
          /any updates/i
        ],
        confidence: 75,
        nextSteps: 'Respond with current status or interest level'
      },
      
      // Screening calls
      screening_call: {
        patterns: [
          /phone screen/i,
          /screening call/i,
          /brief call/i,
          /quick chat/i,
          /initial conversation/i,
          /phone conversation/i
        ],
        confidence: 85,
        nextSteps: 'Schedule the screening call'
      }
    };

    // Check each pattern category with enhanced validation
    for (const [type, config] of Object.entries(patterns)) {
      // First check if any pattern matches
      const patternMatch = config.patterns.some(pattern => pattern.test(content));
      
      if (patternMatch) {
        // Validate required context
        let hasRequiredContext = true;
        if (config.requiredContext) {
          hasRequiredContext = config.requiredContext.some(context => 
            content.includes(context.toLowerCase())
          );
        }
        
        // Check for exclusion patterns
        let hasExclusionPattern = false;
        if (config.excludePatterns) {
          hasExclusionPattern = config.excludePatterns.some(pattern => 
            pattern.test(content)
          );
        }
        
        // Only proceed if context is valid and no exclusion patterns
        if (hasRequiredContext && !hasExclusionPattern) {
          const company = this.extractCompanyAdvanced(from, subject, text, fromDomain);
          const jobTitle = this.extractJobTitleAdvanced(subject, text);
          const deadline = this.extractDeadline(text);
          const assessmentLink = type === 'assessment' ? this.extractLinks(text)[0] : null;
          
          return {
            type,
            company,
            jobTitle,
            confidence: config.confidence,
            summary: `Pattern-matched as ${type.replace('_', ' ')}`,
            nextSteps: config.nextSteps,
            deadline,
            assessmentLink,
            fromDomain,
            isJobRelated: true,
            validationPassed: true
          };
        }
      }
    }

    // Check if it's job-related but type unclear
    const jobKeywords = [
      'application', 'position', 'role', 'job', 'interview', 'recruiter', 
      'hiring', 'candidate', 'resume', 'cv', 'career', 'opportunity',
      'talent', 'recruitment', 'hr', 'human resources'
    ];

    const isJobRelated = jobKeywords.some(keyword => 
      content.includes(keyword) || fromDomain.includes(keyword)
    );

    if (isJobRelated) {
      return {
        type: 'other',
        company: this.extractCompanyAdvanced(from, subject, text, fromDomain),
        jobTitle: this.extractJobTitleAdvanced(subject, text),
        confidence: 60,
        summary: 'Job-related email but specific type unclear',
        nextSteps: 'Review the email and take appropriate action',
        deadline: this.extractDeadline(text),
        assessmentLink: null,
        fromDomain,
        isJobRelated: true
      };
    }

    return null;
  }

  classifyWithPatterns(emailData) {
    const { subject, from, text } = emailData;
    const content = `${subject} ${text}`.toLowerCase();

    // Pattern-based classification
    const patterns = {
      rejection: [
        /unfortunately.*not moving forward/i,
        /decided to pursue other candidates/i,
        /position has been filled/i,
        /not selected/i,
        /thank you for your interest.*however/i
      ],
      assessment: [
        /coding challenge/i,
        /technical assessment/i,
        /complete.*test/i,
        /hackerrank/i,
        /codility/i,
        /take.*assessment/i,
        /programming challenge/i
      ],
      interview_invite: [
        /schedule.*interview/i,
        /interview invitation/i,
        /next round/i,
        /would like to interview/i,
        /phone.*interview/i,
        /video.*interview/i
      ],
      offer: [
        /job offer/i,
        /pleased to offer/i,
        /offer letter/i,
        /compensation/i,
        /salary/i
      ]
    };

    for (const [type, patternList] of Object.entries(patterns)) {
      if (patternList.some(pattern => pattern.test(content))) {
        return {
          type,
          company: this.extractCompany(from, subject),
          jobTitle: this.extractJobTitle(subject, text),
          confidence: 80,
          summary: `Pattern-matched as ${type}`,
          nextSteps: this.getDefaultNextSteps(type),
          deadline: null,
          assessmentLink: type === 'assessment' ? this.extractLinks(text)[0] : null
        };
      }
    }

    return {
      type: 'other',
      company: this.extractCompany(from, subject),
      confidence: 60,
      summary: 'Job-related email but type unclear'
    };
  }

  extractDomain(email) {
    const match = email.match(/@([^.]+\.[^>\s]+)/);
    return match ? match[1].toLowerCase() : '';
  }

  extractCompanyAdvanced(from, subject, text, domain) {
    // Priority 1: Extract from common email patterns
    const companyPatterns = [
      /from\s+([A-Z][a-zA-Z\s&]+)(?:\s+team|\s+recruiting|\s+hr)/i,
      /([A-Z][a-zA-Z\s&]+)\s+(?:team|recruiting|talent|hr)/i,
      /at\s+([A-Z][a-zA-Z\s&]+)/i,
      /([A-Z][a-zA-Z\s&]+)\s+is\s+hiring/i,
      /join\s+([A-Z][a-zA-Z\s&]+)/i
    ];

    for (const pattern of companyPatterns) {
      const match = subject.match(pattern) || text.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 50) {
        return match[1].trim();
      }
    }

    // Priority 2: Extract from domain (exclude common email providers)
    const excludedDomains = [
      'gmail', 'yahoo', 'outlook', 'hotmail', 'aol', 'icloud',
      'noreply', 'no-reply', 'donotreply', 'notifications'
    ];
    
    if (domain && !excludedDomains.some(excluded => domain.includes(excluded))) {
      // Clean up domain to company name
      const companyName = domain
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      if (companyName.length > 2) {
        return companyName;
      }
    }

    // Priority 3: Look for company signatures in email
    const signaturePatterns = [
      /best regards,?\s*([A-Z][a-zA-Z\s&]+)/i,
      /sincerely,?\s*([A-Z][a-zA-Z\s&]+)/i,
      /([A-Z][a-zA-Z\s&]+)\s+(?:inc|corp|ltd|llc|company)/i
    ];

    for (const pattern of signaturePatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 50) {
        return match[1].trim();
      }
    }

    return 'Unknown Company';
  }

  extractJobTitleAdvanced(subject, text) {
    // Comprehensive job title patterns
    const titlePatterns = [
      // Direct patterns
      /(?:position|role|job).*?([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Designer|Architect|Lead|Director|Coordinator|Associate|Intern))/i,
      /for\s+(?:the\s+)?([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Designer|Architect|Lead|Director|Coordinator|Associate|Intern))/i,
      /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Designer|Architect|Lead|Director|Coordinator|Associate|Intern))\s+(?:position|role|job|opening)/i,
      
      // Technology-specific patterns
      /(?:senior|junior|mid-level|lead)?\s*([A-Z][a-zA-Z\s]*(?:engineer|developer|programmer|architect))/i,
      /(full\s*stack|front\s*end|back\s*end|software|web|mobile|data|devops|ml|ai)\s+(?:engineer|developer)/i,
      
      // Generic patterns
      /application\s+for\s+([A-Z][a-zA-Z\s]+)/i,
      /your\s+application\s+for\s+([A-Z][a-zA-Z\s]+)/i,
      /interview\s+for\s+([A-Z][a-zA-Z\s]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = subject.match(pattern) || text.substring(0, 500).match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        // Filter out overly long or short matches
        if (title.length > 3 && title.length < 100) {
          return title;
        }
      }
    }

    return null;
  }

  extractDeadline(text) {
    // Look for deadline patterns
    const deadlinePatterns = [
      /(?:deadline|due|complete\s+by|submit\s+by|finish\s+by).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:deadline|due|complete\s+by|submit\s+by|finish\s+by).*?(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
      /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /within\s+(\d+)\s+(?:days|hours)/i
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const dateStr = match[1];
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          // If relative deadline (e.g., "within 3 days")
          if (match[1] && /^\d+$/.test(match[1])) {
            const days = parseInt(match[1]);
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + days);
            return deadline.toISOString().split('T')[0];
          }
        }
      }
    }

    return null;
  }

  extractLinks(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  getDefaultNextSteps(type) {
    const steps = {
      rejection: 'No action required. Consider asking for feedback.',
      assessment: 'Complete the technical assessment by the deadline.',
      interview_invite: 'Respond to schedule the interview.',
      offer: 'Review the offer and respond accordingly.',
      update: 'Review the update and respond if needed.'
    };
    return steps[type] || 'Review the email and take appropriate action.';
  }

  async processJobEmail(jobInfo, emailData) {
    try {
      // Try to match with existing job applications
      const matchingJob = await this.findMatchingJob(jobInfo);
      
      if (matchingJob) {
        // Update existing job status
        await this.updateJobFromEmail(matchingJob, jobInfo);
        console.log(`✅ Updated job ${matchingJob.id} with email info`);
      } else {
        // Create new job entry if it's a new opportunity
        if (jobInfo.type === 'interview_invite' || jobInfo.type === 'assessment') {
          await this.createJobFromEmail(jobInfo);
          console.log(`✅ Created new job from email`);
        }
      }

      // Store email event
      await this.storeEmailEvent(jobInfo, emailData, matchingJob?.id);
      
    } catch (error) {
      console.error('Error processing job email:', error);
    }
  }

  async findMatchingJob(jobInfo) {
    // Try to find matching job by company and title
    const jobs = await databaseService.getJobs();
    
    return jobs.find(job => {
      const companyMatch = job.company_name.toLowerCase().includes(jobInfo.company.toLowerCase()) ||
                          jobInfo.company.toLowerCase().includes(job.company_name.toLowerCase());
      
      const titleMatch = !jobInfo.jobTitle || 
                        job.job_title.toLowerCase().includes(jobInfo.jobTitle.toLowerCase()) ||
                        jobInfo.jobTitle.toLowerCase().includes(job.job_title.toLowerCase());
      
      return companyMatch && titleMatch;
    });
  }

  async updateJobFromEmail(job, jobInfo) {
    const statusMap = {
      rejection: 'rejected',
      assessment: 'assessment',
      interview_invite: 'interviewing',
      offer: 'offer'
    };

    const newStatus = statusMap[jobInfo.type];
    if (newStatus) {
      await databaseService.updateJobStatus(job.job_url, newStatus);
    }

    // Append audit note for auto-updates (avoid duplicate with assessment-specific block)
    if (jobInfo.type !== 'assessment') {
      const pool = require('../config/database');
      const note = `\n--- Email Update (${new Date().toISOString()}) ---\nType: ${jobInfo.type}\nSummary: ${jobInfo.summary}\nNext Steps: ${jobInfo.nextSteps || ''}`;
      const noteQuery = `
        UPDATE jobs 
        SET notes = COALESCE(notes, '') || $1
        WHERE id = $2
      `;
      await pool.query(noteQuery, [note, job.id]);
    }

    // Add assessment info if applicable
    if (jobInfo.type === 'assessment' && jobInfo.assessmentLink) {
      const query = `
        UPDATE jobs 
        SET assessment_link = $1, assessment_deadline = $2, notes = COALESCE(notes, '') || $3
        WHERE id = $4
      `;
      
      const pool = require('../config/database');
      await pool.query(query, [
        jobInfo.assessmentLink,
        jobInfo.deadline,
        `\n--- Email Update (${new Date().toISOString()}) ---\nType: assessment\n${jobInfo.summary}\nNext Steps: ${jobInfo.nextSteps}`,
        job.id
      ]);
    }
  }

  async createJobFromEmail(jobInfo) {
    const jobData = {
      jobTitle: jobInfo.jobTitle || 'Position from Email',
      companyName: jobInfo.company,
      platform: 'email',
      jobUrl: `mailto:${jobInfo.company.toLowerCase().replace(/\s+/g, '')}-job`,
      applicationStatus: jobInfo.type === 'assessment' ? 'assessment' : 'interviewing'
    };

    return await databaseService.upsertJob(jobData);
  }

  async storeEmailEvent(jobInfo, emailData, jobId) {
    // Check if this email has already been processed
    const checkQuery = `
      SELECT id FROM email_events 
      WHERE email_subject = $1 AND email_from = $2 AND 
            ABS(EXTRACT(EPOCH FROM (processed_at - $3))) < 3600
      LIMIT 1;
    `;
    
    const pool = require('../config/database');
    const emailDate = emailData.date ? new Date(emailData.date) : new Date();
    const existingEmail = await pool.query(checkQuery, [
      emailData.subject,
      emailData.from,
      emailDate
    ]);
    
    if (existingEmail.rows.length > 0) {
      console.log(`📧 Skipping duplicate email: ${emailData.subject}`);
      return existingEmail.rows[0];
    }

    // Store new email event
    const insertQuery = `
      INSERT INTO email_events (
        job_id, email_type, email_subject, email_from, 
        email_content, metadata, processed_at, email_message_id
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      RETURNING *;
    `;

    return await pool.query(insertQuery, [
      jobId,
      jobInfo.type,
      emailData.subject,
      emailData.from,
      emailData.text.substring(0, 2000), // Limit content length
      JSON.stringify({
        confidence: jobInfo.confidence,
        nextSteps: jobInfo.nextSteps,
        deadline: jobInfo.deadline,
        assessmentLink: jobInfo.assessmentLink,
        messageId: emailData.messageId
      }),
      emailData.messageId
    ]);
  }

  // Public method to start monitoring
  async startMonitoring(intervalMinutes = 60) { // Default to 60 minutes (1 hour)
    console.log(`🔄 Starting Gmail monitoring every ${intervalMinutes} minutes`);
    
    // Clear any existing interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Initial check
    try {
      await this.checkForJobEmails();
    } catch (error) {
      console.error('Initial email check failed:', error);
    }

    // Set up periodic checking
    this.monitoringInterval = setInterval(async () => {
      try {
        console.log(`🔄 Periodic email check starting at ${new Date().toISOString()}`);
        await this.checkForJobEmails();
      } catch (error) {
        console.error('Periodic email check failed:', error);
        // Try to reconnect
        this.isConnected = false;
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Method to stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('📪 Email monitoring stopped');
    }
  }
}

module.exports = new GmailImapService();
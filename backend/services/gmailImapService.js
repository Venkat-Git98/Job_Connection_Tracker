const Imap = require('imap');
const { simpleParser } = require('mailparser');
const geminiService = require('./geminiService');
const databaseService = require('./databaseService');

class GmailImapService {
  constructor() {
    this.imap = null;
    this.isConnected = false;
    this.lastCheckedDate = new Date();
    
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

              // Check if this is a job-related email
              const jobInfo = await this.analyzeJobEmail(emailData);
              if (jobInfo) {
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
    
    // Advanced pattern matching for job-related emails
    const analysis = this.classifyWithAdvancedPatterns(emailData);
    
    if (analysis && analysis.confidence >= 70) {
      return analysis;
    }
    
    return null;
  }

  classifyWithAdvancedPatterns(emailData) {
    const { subject, from, text } = emailData;
    const content = `${subject} ${text}`.toLowerCase();
    const fromDomain = this.extractDomain(from);
    
    // Comprehensive pattern matching system
    const patterns = {
      // Application confirmations
      application_confirmation: {
        patterns: [
          /thank you for your application/i,
          /application received/i,
          /we have received your application/i,
          /your application for.*has been received/i,
          /application submitted successfully/i
        ],
        confidence: 85,
        nextSteps: 'Wait for further communication from the company'
      },
      
      // Rejections - High confidence patterns
      rejection: {
        patterns: [
          /unfortunately.*not moving forward/i,
          /decided to pursue other candidates/i,
          /position has been filled/i,
          /not selected/i,
          /thank you for your interest.*however/i,
          /we will not be moving forward/i,
          /chosen to move forward with other candidates/i,
          /your application was not successful/i,
          /regret to inform you/i,
          /after careful consideration.*not proceed/i
        ],
        confidence: 95,
        nextSteps: 'No action required. Consider asking for feedback.'
      },
      
      // Technical assessments
      assessment: {
        patterns: [
          /coding challenge/i,
          /technical assessment/i,
          /complete.*test/i,
          /hackerrank/i,
          /codility/i,
          /take.*assessment/i,
          /programming challenge/i,
          /technical evaluation/i,
          /coding exercise/i,
          /online assessment/i,
          /technical screening/i
        ],
        confidence: 90,
        nextSteps: 'Complete the technical assessment by the deadline'
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
      
      // Job offers
      offer: {
        patterns: [
          /job offer/i,
          /pleased to offer/i,
          /offer letter/i,
          /compensation/i,
          /salary.*offer/i,
          /extend.*offer/i,
          /offer of employment/i,
          /congratulations.*selected/i
        ],
        confidence: 95,
        nextSteps: 'Review the offer and respond accordingly'
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

    // Check each pattern category
    for (const [type, config] of Object.entries(patterns)) {
      if (config.patterns.some(pattern => pattern.test(content))) {
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
          isJobRelated: true
        };
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
    const query = `
      INSERT INTO email_events (
        job_id, email_type, email_subject, email_from, 
        email_content, metadata, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const pool = require('../config/database');
    return await pool.query(query, [
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
      })
    ]);
  }

  // Public method to start monitoring
  async startMonitoring(intervalMinutes = 5) {
    console.log(`🔄 Starting Gmail monitoring every ${intervalMinutes} minutes`);
    
    // Initial check
    try {
      await this.checkForJobEmails();
    } catch (error) {
      console.error('Initial email check failed:', error);
    }

    // Set up periodic checking
    setInterval(async () => {
      try {
        await this.checkForJobEmails();
      } catch (error) {
        console.error('Periodic email check failed:', error);
        // Try to reconnect
        this.isConnected = false;
      }
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = new GmailImapService();
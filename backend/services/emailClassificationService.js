// const geminiService = require('./geminiService'); // Disabled - using pattern-based classification only

class EmailClassificationService {
  constructor() {
    this.classificationHistory = new Map(); // Store classification results for learning
  }

  async classifyEmailWithAI(emailData) {
    // AI classification disabled - using pattern-based classification only
    console.log('🚫 AI classification disabled, using pattern-based classification only');
    return null;
  }

  buildClassificationPrompt(emailData) {
    const { subject, from, text } = emailData;
    const fromDomain = this.extractDomain(from);
    
    return `You are an expert email classifier for job search automation. Analyze this email and determine if it's job-related and what type.

EMAIL DETAILS:
Subject: ${subject}
From: ${from}
Domain: ${fromDomain}
Content: ${text.substring(0, 1000)}...

CLASSIFICATION RULES:
1. ONLY classify as job-related if the email is directly about a specific job application, interview, or hiring process
2. EXCLUDE newsletters, marketing emails, general company updates, or educational content
3. EXCLUDE emails about job opportunities that aren't specific to the recipient's application

EMAIL TYPES TO CLASSIFY:
- rejection: Clear rejection of a job application
- interview_invite: Invitation to interview for a specific position
- assessment: Request to complete a technical test/assessment for a job
- offer: Job offer or employment offer
- application_confirmation: Confirmation that application was received
- follow_up: Follow-up on existing application status
- other: Job-related but doesn't fit other categories
- not_job_related: Not related to job applications

ANALYSIS CRITERIA:
1. Sender credibility (HR, recruiter, ATS system vs newsletter/marketing)
2. Content personalization (mentions specific application, position, candidate name)
3. Action items (specific next steps for the candidate)
4. Context clues (references to applications, interviews, positions)

EXAMPLES OF NOT JOB-RELATED:
- Company newsletters with job listings
- General career advice or tips
- Educational content about skills/technology
- Marketing emails from job platforms
- Industry news or updates
- Webinar invitations
- Course promotions

Respond in JSON format:
{
  "isJobRelated": boolean,
  "type": "string",
  "confidence": number (0-100),
  "reasoning": "string explaining the decision",
  "company": "string or null",
  "jobTitle": "string or null",
  "nextSteps": "string or null",
  "redFlags": ["array of concerns if any"]
}`;
  }

  parseAIClassification(responseText) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const classification = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (typeof classification.isJobRelated !== 'boolean') {
        throw new Error('Invalid isJobRelated field');
      }
      
      if (classification.confidence < 0 || classification.confidence > 100) {
        classification.confidence = 50; // Default if invalid
      }
      
      return classification;
    } catch (error) {
      console.error('Failed to parse AI classification:', error);
      return {
        isJobRelated: false,
        type: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
        company: null,
        jobTitle: null,
        nextSteps: null,
        redFlags: ['parsing_error']
      };
    }
  }

  extractDomain(email) {
    const match = email.match(/@([^.]+\.[^>\s]+)/);
    return match ? match[1].toLowerCase() : '';
  }

  storeClassificationResult(emailData, classification) {
    const key = this.generateEmailKey(emailData);
    this.classificationHistory.set(key, {
      emailData: {
        subject: emailData.subject,
        from: emailData.from,
        domain: this.extractDomain(emailData.from)
      },
      classification,
      timestamp: new Date()
    });
    
    // Keep only last 1000 classifications to prevent memory issues
    if (this.classificationHistory.size > 1000) {
      const firstKey = this.classificationHistory.keys().next().value;
      this.classificationHistory.delete(firstKey);
    }
  }

  generateEmailKey(emailData) {
    return `${emailData.from}_${emailData.subject}_${emailData.date}`;
  }

  // Get classification statistics for monitoring
  getClassificationStats() {
    const stats = {
      total: this.classificationHistory.size,
      byType: {},
      byDomain: {},
      averageConfidence: 0,
      recentClassifications: []
    };
    
    let totalConfidence = 0;
    const recent = [];
    
    for (const [key, result] of this.classificationHistory.entries()) {
      const type = result.classification.type;
      const domain = result.emailData.domain;
      
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
      totalConfidence += result.classification.confidence;
      
      recent.push({
        subject: result.emailData.subject,
        type: result.classification.type,
        confidence: result.classification.confidence,
        timestamp: result.timestamp
      });
    }
    
    stats.averageConfidence = stats.total > 0 ? totalConfidence / stats.total : 0;
    stats.recentClassifications = recent
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    return stats;
  }

  // Method to improve classification based on feedback
  async improveClassification(emailKey, correctType, feedback) {
    const stored = this.classificationHistory.get(emailKey);
    if (stored) {
      stored.feedback = {
        correctType,
        feedback,
        timestamp: new Date()
      };
      
      // Could be used to retrain or adjust patterns
      console.log(`Classification feedback received for ${emailKey}: ${correctType}`);
    }
  }

  // Pattern-only classification (AI disabled)
  async hybridClassification(emailData, patternResult) {
    // Use only pattern-based classification - no AI
    if (patternResult && patternResult.confidence >= 70) {
      console.log(`✅ Email classified using patterns: ${patternResult.type} (${patternResult.confidence}% confidence)`);
      return {
        type: patternResult.type,
        company: patternResult.company,
        jobTitle: patternResult.jobTitle,
        confidence: patternResult.confidence,
        summary: `Pattern-based classification: ${patternResult.summary || 'Classified using email patterns'}`,
        nextSteps: patternResult.nextSteps,
        deadline: patternResult.deadline,
        assessmentLink: patternResult.assessmentLink,
        fromDomain: patternResult.fromDomain,
        isJobRelated: true,
        patternClassification: patternResult
      };
    }
    
    // If pattern confidence is too low, don't classify as job-related
    console.log(`❌ Email not classified as job-related (pattern confidence: ${patternResult?.confidence || 0}%)`);
    return null;
  }
}

module.exports = new EmailClassificationService();
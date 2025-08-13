const Joi = require('joi');

class ExtractionService {
  validateProfileData(data) {
    const schema = Joi.object({
      personName: Joi.string().required().max(255),
      profileUrl: Joi.string().uri().required().max(500),
      currentTitle: Joi.string().allow('').max(255),
      currentCompany: Joi.string().allow('').max(255),
      location: Joi.string().allow('').max(255),
      headline: Joi.string().allow('').max(500),
      about: Joi.string().allow(''),
      experiences: Joi.array().items(Joi.object({
        title: Joi.string().allow(''),
        company: Joi.string().allow(''),
        duration: Joi.string().allow(''),
        description: Joi.string().allow('')
      }))
    });

    return schema.validate(data);
  }

  validateJobData(data) {
    const schema = Joi.object({
      jobTitle: Joi.string().min(1).required().max(255),
      companyName: Joi.string().allow('').max(255), // Allow empty company name
      platform: Joi.string().required().max(100),
      jobUrl: Joi.string().uri().required().max(500),
      location: Joi.string().allow('').max(255),
      postedDate: Joi.any().allow('', null),
      applicationStatus: Joi.string().valid('viewed', 'applied', 'interviewing', 'rejected', 'offer').default('viewed')
    });

    return schema.validate(data);
  }

  normalizeProfileData(rawData) {
    return {
      personName: this.sanitizeString(rawData.personName || ''),
      profileUrl: this.sanitizeUrl(rawData.profileUrl || ''),
      currentTitle: this.sanitizeString(rawData.currentTitle || ''),
      currentCompany: this.sanitizeString(rawData.currentCompany || ''),
      location: this.sanitizeString(rawData.location || ''),
      headline: this.sanitizeString(rawData.headline || ''),
      about: this.sanitizeString(rawData.about || ''),
      experiences: this.normalizeExperiences(rawData.experiences || [])
    };
  }

  normalizeJobData(rawData) {
    console.log('🔧 Normalizing job data:', rawData);
    
    const normalized = {
      jobTitle: this.sanitizeString(rawData.jobTitle || ''),
      companyName: this.sanitizeString(rawData.companyName || '') || 'Unknown Company',
      platform: this.extractPlatform(rawData.jobUrl || rawData.platform || ''),
      jobUrl: this.sanitizeUrl(rawData.jobUrl || ''),
      location: this.sanitizeString(rawData.location || ''),
      postedDate: this.normalizeDate(rawData.postedDate),
      applicationStatus: rawData.applicationStatus || 'viewed'
    };
    
    console.log('✅ Normalized job data:', normalized);
    return normalized;
  }

  normalizeExperiences(experiences) {
    if (!Array.isArray(experiences)) return [];
    
    return experiences.map(exp => ({
      title: this.sanitizeString(exp.title || ''),
      company: this.sanitizeString(exp.company || ''),
      duration: this.sanitizeString(exp.duration || ''),
      description: this.sanitizeString(exp.description || '')
    })).filter(exp => exp.title || exp.company);
  }

  extractPlatform(url) {
    if (!url) return 'unknown';
    
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed.com')) return 'indeed';
    if (hostname.includes('greenhouse.io')) return 'greenhouse';
    if (hostname.includes('lever.co')) return 'lever';
    if (hostname.includes('workday.com')) return 'workday';
    if (hostname.includes('wellfound.com')) return 'wellfound';
    if (hostname.includes('glassdoor.com')) return 'glassdoor';
    
    return hostname.replace('www.', '');
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').substring(0, 1000);
  }

  sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return '';
    }
  }

  normalizeDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  classifyPageType(url, title = '', content = '') {
    if (!url) return 'unknown';
    
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // LinkedIn profile detection
    if (urlLower.includes('linkedin.com/in/')) {
      return 'linkedin_profile';
    }
    
    // Job posting detection
    const jobIndicators = [
      'linkedin.com/jobs/',
      'indeed.com/viewjob',
      'greenhouse.io',
      'lever.co',
      'workday.com',
      'wellfound.com/jobs',
      'glassdoor.com/job'
    ];
    
    if (jobIndicators.some(indicator => urlLower.includes(indicator))) {
      return 'job_application';
    }
    
    // Fallback detection based on content
    if (titleLower.includes('job') || titleLower.includes('career') || 
        contentLower.includes('apply now') || contentLower.includes('job description')) {
      return 'job_application';
    }
    
    return 'unknown';
  }
}

module.exports = new ExtractionService();
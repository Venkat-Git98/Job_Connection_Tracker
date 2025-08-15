const Joi = require('joi');

class ExtractionService {
  validateProfileData(data) {
    const schema = Joi.object({
      personName: Joi.string().min(1).required().max(255).messages({
        'string.empty': 'Person name cannot be empty',
        'string.min': 'Person name must be at least 1 character',
        'any.required': 'Person name is required'
      }),
      profileUrl: Joi.string().uri().required().max(500).messages({
        'string.uri': 'Profile URL must be a valid URL',
        'any.required': 'Profile URL is required'
      }),
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
      jobTitle: Joi.string().min(2).required().max(255).messages({
        'string.empty': 'Job title cannot be empty',
        'string.min': 'Job title must be at least 2 characters',
        'any.required': 'Job title is required'
      }),
      companyName: Joi.string().min(2).required().max(255).messages({
        'string.empty': 'Company name cannot be empty',
        'string.min': 'Company name must be at least 2 characters',
        'any.required': 'Company name is required'
      }),
      platform: Joi.string().required().max(100),
      jobUrl: Joi.string().uri().required().max(500).messages({
        'string.uri': 'Job URL must be a valid URL',
        'any.required': 'Job URL is required'
      }),
      location: Joi.string().allow('').max(255),
      postedDate: Joi.any().allow('', null),
      applicationStatus: Joi.string().valid('viewed', 'applied', 'interviewing', 'rejected', 'offer').default('viewed')
    });

    return schema.validate(data);
  }

  validateCompanyData(data) {
    const schema = Joi.object({
      companyName: Joi.string().min(2).required().max(255).messages({
        'string.empty': 'Company name cannot be empty',
        'string.min': 'Company name must be at least 2 characters',
        'any.required': 'Company name is required'
      }),
      companyUrl: Joi.string().uri().required().max(500).messages({
        'string.uri': 'Company URL must be a valid URL',
        'any.required': 'Company URL is required'
      }),
      industry: Joi.string().allow('').max(255),
      location: Joi.string().allow('').max(255),
      employeeCount: Joi.string().allow('').max(100),
      description: Joi.string().allow('').max(2000),
      website: Joi.string().allow('').max(500),
      founded: Joi.string().allow('').max(10)
    });

    return schema.validate(data);
  }

  normalizeProfileData(rawData) {
    const normalized = {
      personName: this.sanitizeString(rawData.personName || ''),
      profileUrl: this.sanitizeUrl(rawData.profileUrl || ''),
      currentTitle: this.sanitizeString(rawData.currentTitle || ''),
      currentCompany: this.sanitizeString(rawData.currentCompany || ''),
      location: this.normalizeLocation(rawData.location || ''),
      headline: this.sanitizeString(rawData.headline || ''),
      about: this.sanitizeString(rawData.about || ''),
      experiences: this.normalizeExperiences(rawData.experiences || [])
    };

    // Enhanced data quality checks
    normalized.personName = this.enhancePersonName(normalized.personName);
    normalized.currentCompany = this.enhanceCompanyName(normalized.currentCompany, rawData.profileUrl);
    
    return normalized;
  }

  normalizeJobData(rawData) {
    console.log('🔧 Normalizing job data:', rawData);
    
    const normalized = {
      jobTitle: this.sanitizeString(rawData.jobTitle || ''),
      companyName: this.sanitizeString(rawData.companyName || ''),
      platform: this.extractPlatform(rawData.jobUrl || rawData.platform || ''),
      jobUrl: this.sanitizeUrl(rawData.jobUrl || ''),
      location: this.normalizeLocation(rawData.location || ''),
      postedDate: this.normalizeDate(rawData.postedDate),
      applicationStatus: rawData.applicationStatus || 'viewed'
    };

    // Enhanced data quality improvements
    normalized.jobTitle = this.enhanceJobTitle(normalized.jobTitle);
    normalized.companyName = this.enhanceCompanyName(normalized.companyName, normalized.jobUrl);
    normalized.location = this.enhanceLocation(normalized.location);
    
    // Final validation and fallbacks
    if (!normalized.jobTitle || normalized.jobTitle.length < 2) {
      normalized.jobTitle = 'Job Position'; // Fallback title
      console.warn('⚠️ Using fallback job title');
    }
    
    if (!normalized.companyName || normalized.companyName.length < 2) {
      // Try to extract from URL as last resort
      const urlCompany = this.extractCompanyFromUrl(normalized.jobUrl);
      normalized.companyName = urlCompany || 'Company'; // Fallback company
      console.warn('⚠️ Using fallback company name:', normalized.companyName);
    }
    
    console.log('✅ Normalized job data:', normalized);
    return normalized;
  }

  normalizeCompanyData(rawData) {
    console.log('🔧 Normalizing company data:', rawData);
    
    const normalized = {
      companyName: this.sanitizeString(rawData.companyName || ''),
      companyUrl: this.sanitizeUrl(rawData.companyUrl || ''),
      industry: this.sanitizeString(rawData.industry || ''),
      location: this.normalizeLocation(rawData.location || ''),
      employeeCount: this.sanitizeString(rawData.employeeCount || ''),
      description: this.sanitizeString(rawData.description || ''),
      website: this.sanitizeUrl(rawData.website || ''),
      founded: this.sanitizeString(rawData.founded || '')
    };

    // Enhanced data quality improvements
    normalized.companyName = this.enhanceCompanyName(normalized.companyName, normalized.companyUrl);
    normalized.location = this.enhanceLocation(normalized.location);
    
    // Final validation and fallbacks
    if (!normalized.companyName || normalized.companyName.length < 2) {
      // Try to extract from URL as last resort
      const urlCompany = this.extractCompanyFromUrl(normalized.companyUrl);
      normalized.companyName = urlCompany || 'Company'; // Fallback company
      console.warn('⚠️ Using fallback company name:', normalized.companyName);
    }
    
    console.log('✅ Normalized company data:', normalized);
    return normalized;
  }

  enhancePersonName(name) {
    if (!name || name.length < 2) return name;
    
    // Remove common LinkedIn suffixes
    const suffixesToRemove = [
      ', MBA', ', PhD', ', CPA', ', PMP', ', CISSP',
      ' (He/Him)', ' (She/Her)', ' (They/Them)',
      ' - Hiring', ' - Open to Work'
    ];
    
    let enhanced = name;
    suffixesToRemove.forEach(suffix => {
      enhanced = enhanced.replace(new RegExp(suffix, 'gi'), '');
    });
    
    // Proper case formatting
    enhanced = enhanced.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return enhanced.trim();
  }

  enhanceJobTitle(title) {
    if (!title || title.length < 2) return title;
    
    // Remove common job posting prefixes/suffixes
    const cleanPatterns = [
      /^(Job|Position|Role|Opening):\s*/i,
      /\s*-\s*(Remote|Hybrid|On-site)$/i,
      /\s*\(.*?\)$/,  // Remove parenthetical info
      /\s*-\s*\d+\s*months?$/i,  // Remove contract duration
    ];
    
    let enhanced = title;
    cleanPatterns.forEach(pattern => {
      enhanced = enhanced.replace(pattern, '');
    });
    
    // Standardize common abbreviations
    const standardizations = {
      'Sr.': 'Senior',
      'Jr.': 'Junior',
      'Mgr': 'Manager',
      'Dev': 'Developer',
      'Eng': 'Engineer',
      'Spec': 'Specialist'
    };
    
    Object.entries(standardizations).forEach(([abbrev, full]) => {
      enhanced = enhanced.replace(new RegExp(`\\b${abbrev}\\b`, 'gi'), full);
    });
    
    return enhanced.trim();
  }

  enhanceCompanyName(companyName, url = '') {
    if (!companyName || companyName.toLowerCase() === 'unknown company') {
      // Try to extract company from URL
      if (url) {
        const extractedCompany = this.extractCompanyFromUrl(url);
        if (extractedCompany) return extractedCompany;
      }
      return ''; // Return empty instead of "Unknown Company"
    }
    
    // Remove common company suffixes for cleaner display
    const suffixesToClean = [
      ', Inc.', ', LLC', ', Corp.', ', Corporation', ', Ltd.',
      ' Inc.', ' LLC', ' Corp.', ' Corporation', ' Ltd.',
      ' Company', ' Co.', ' Group', ' Solutions', ' Services'
    ];
    
    let enhanced = companyName;
    suffixesToClean.forEach(suffix => {
      if (enhanced.endsWith(suffix)) {
        enhanced = enhanced.slice(0, -suffix.length);
      }
    });
    
    return enhanced.trim();
  }

  extractCompanyFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Company-specific URL patterns
      const companyPatterns = {
        'greenhouse.io': () => {
          const pathParts = urlObj.pathname.split('/');
          return pathParts[1] ? this.formatCompanyName(pathParts[1]) : null;
        },
        'lever.co': () => {
          const pathParts = urlObj.pathname.split('/');
          return pathParts[1] ? this.formatCompanyName(pathParts[1]) : null;
        },
        'workday.com': () => {
          const subdomain = hostname.split('.')[0];
          return subdomain !== 'www' ? this.formatCompanyName(subdomain) : null;
        }
      };
      
      for (const [domain, extractor] of Object.entries(companyPatterns)) {
        if (hostname.includes(domain)) {
          return extractor();
        }
      }
      
      // Generic subdomain extraction
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        return this.formatCompanyName(parts[0]);
      }
      
    } catch (error) {
      console.warn('Failed to extract company from URL:', url, error);
    }
    
    return null;
  }

  formatCompanyName(rawName) {
    return rawName
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  normalizeLocation(location) {
    if (!location) return '';
    
    // Clean up common location formats
    let normalized = location
      .replace(/\s*,\s*/g, ', ')  // Standardize comma spacing
      .replace(/\s+/g, ' ')       // Remove extra spaces
      .trim();
    
    // Handle remote work indicators
    const remotePatterns = [
      /remote/i,
      /work from home/i,
      /wfh/i,
      /anywhere/i
    ];
    
    if (remotePatterns.some(pattern => pattern.test(normalized))) {
      return 'Remote';
    }
    
    return normalized;
  }

  enhanceLocation(location) {
    if (!location) return '';
    
    // Standardize common location abbreviations
    const locationMappings = {
      'SF': 'San Francisco, CA',
      'NYC': 'New York, NY',
      'LA': 'Los Angeles, CA',
      'DC': 'Washington, DC',
      'UK': 'United Kingdom',
      'US': 'United States'
    };
    
    let enhanced = location;
    Object.entries(locationMappings).forEach(([abbrev, full]) => {
      if (enhanced === abbrev) {
        enhanced = full;
      }
    });
    
    return enhanced;
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
    
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      const platformMappings = {
        'linkedin.com': 'LinkedIn',
        'indeed.com': 'Indeed',
        'greenhouse.io': 'Greenhouse',
        'lever.co': 'Lever',
        'workday.com': 'Workday',
        'wellfound.com': 'Wellfound',
        'glassdoor.com': 'Glassdoor',
        'monster.com': 'Monster',
        'ziprecruiter.com': 'ZipRecruiter',
        'careerbuilder.com': 'CareerBuilder',
        'dice.com': 'Dice',
        'stackoverflow.com': 'Stack Overflow'
      };
      
      for (const [domain, platform] of Object.entries(platformMappings)) {
        if (hostname.includes(domain)) {
          return platform;
        }
      }
      
      return hostname.replace('www.', '');
    } catch (error) {
      return 'unknown';
    }
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    return str
      .trim()
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\x20-\x7E]/g, '')   // Remove non-printable characters
      .substring(0, 1000);            // Limit length
  }

  sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
      const urlObj = new URL(url);
      // Remove tracking parameters
      const cleanParams = new URLSearchParams();
      for (const [key, value] of urlObj.searchParams) {
        if (!this.isTrackingParameter(key)) {
          cleanParams.set(key, value);
        }
      }
      urlObj.search = cleanParams.toString();
      return urlObj.href;
    } catch {
      return '';
    }
  }

  isTrackingParameter(param) {
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'referrer', 'source', 'campaign'
    ];
    return trackingParams.includes(param.toLowerCase());
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
    
    // LinkedIn company page detection
    if (urlLower.includes('linkedin.com/company/')) {
      return 'linkedin_company';
    }
    
    // Job posting detection - expanded patterns
    const jobIndicators = [
      'linkedin.com/jobs/',
      'indeed.com/viewjob',
      'indeed.com/jobs/',
      'greenhouse.io',
      'lever.co',
      'workday.com',
      'wellfound.com/jobs',
      'glassdoor.com/job',
      'monster.com/job',
      'ziprecruiter.com/jobs/',
      'careerbuilder.com/job/',
      'dice.com/jobs/',
      'stackoverflow.com/jobs/'
    ];
    
    if (jobIndicators.some(indicator => urlLower.includes(indicator))) {
      return 'job_application';
    }
    
    // Enhanced fallback detection based on content
    const jobKeywords = [
      'job', 'career', 'position', 'opening', 'vacancy', 'employment',
      'hiring', 'apply now', 'job posting', 'job description', 'role'
    ];
    
    const hasJobKeyword = jobKeywords.some(keyword => 
      titleLower.includes(keyword) || contentLower.includes(keyword)
    );
    
    if (hasJobKeyword) {
      return 'job_application';
    }
    
    return 'unknown';
  }

  // Data quality scoring
  calculateDataQuality(data, type) {
    let score = 0;
    let maxScore = 0;
    
    if (type === 'profile') {
      maxScore = 100;
      
      // Required fields
      if (data.personName && data.personName.length > 1) score += 30;
      if (data.profileUrl) score += 20;
      
      // Optional but valuable fields
      if (data.currentTitle && data.currentTitle.length > 2) score += 15;
      if (data.currentCompany && data.currentCompany.length > 2) score += 15;
      if (data.location && data.location.length > 2) score += 10;
      if (data.headline && data.headline.length > 10) score += 5;
      if (data.about && data.about.length > 50) score += 5;
      
    } else if (type === 'job') {
      maxScore = 100;
      
      // Required fields
      if (data.jobTitle && data.jobTitle.length > 2) score += 40;
      if (data.companyName && data.companyName.length > 2) score += 30;
      if (data.jobUrl) score += 20;
      
      // Optional but valuable fields
      if (data.location && data.location.length > 2) score += 10;
    }
    
    return Math.round((score / maxScore) * 100);
  }

  // Flag data for manual review
  shouldFlagForReview(data, type) {
    const quality = this.calculateDataQuality(data, type);
    
    if (quality < 60) return true;
    
    if (type === 'profile') {
      if (!data.personName || data.personName.length < 2) return true;
      if (!data.currentCompany && !data.currentTitle) return true;
    } else if (type === 'job') {
      if (!data.jobTitle || data.jobTitle.length < 3) return true;
      if (!data.companyName || data.companyName.length < 2) return true;
    }
    
    return false;
  }
}

module.exports = new ExtractionService();
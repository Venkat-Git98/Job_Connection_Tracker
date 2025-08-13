// Content script for LinkedIn Job Tracker extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'extractPageData') {
    extractPageData(request.url, request.title)
      .then(result => {
        console.log('Content script extraction result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Content script extraction error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getConversationContext') {
    getLinkedInConversationContext()
      .then(context => sendResponse({ context }))
      .catch(error => sendResponse({ context: null, error: error.message }));
    return true;
  }
});

async function extractPageData(url, title) {
  try {
    const classification = classifyPage(url, title);
    let extractedData = {};

    if (classification === 'linkedin_profile') {
      extractedData = extractLinkedInProfile();
    } else if (classification === 'job_application') {
      extractedData = extractJobPosting(url);
    } else {
      extractedData = extractGenericData();
    }

    return {
      success: true,
      data: {
        classification,
        url,
        pageTitle: title,
        pageContent: document.title,
        extractedData
      }
    };
  } catch (error) {
    console.error('Content script extraction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function classifyPage(url, title) {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  console.log('🔍 Classifying page:', { url: urlLower, title: titleLower });
  
  // LinkedIn profile detection
  if (urlLower.includes('linkedin.com/in/')) {
    console.log('✅ Classified as: linkedin_profile');
    return 'linkedin_profile';
  }
  
  // Job posting detection - expanded patterns
  const jobIndicators = [
    'linkedin.com/jobs/',
    'linkedin.com/jobs/view/',
    'indeed.com/viewjob',
    'indeed.com/jobs/',
    'greenhouse.io',
    'lever.co',
    'workday.com',
    'wellfound.com/jobs',
    'glassdoor.com/job',
    'glassdoor.com/jobs/',
    'monster.com/job',
    'ziprecruiter.com/jobs/',
    'simplyhired.com/job/',
    'careerbuilder.com/job/',
    'dice.com/jobs/',
    'stackoverflow.com/jobs/'
  ];
  
  for (const indicator of jobIndicators) {
    if (urlLower.includes(indicator)) {
      console.log('✅ Classified as: job_application (matched:', indicator, ')');
      return 'job_application';
    }
  }
  
  // Enhanced fallback detection based on content and title
  const jobKeywords = [
    'job', 'career', 'position', 'opening', 'vacancy', 'employment',
    'hiring', 'apply now', 'job posting', 'job description', 'role'
  ];
  
  const hasJobKeyword = jobKeywords.some(keyword => 
    titleLower.includes(keyword) || 
    document.body.textContent.toLowerCase().includes(keyword)
  );
  
  if (hasJobKeyword) {
    console.log('✅ Classified as: job_application (keyword match)');
    return 'job_application';
  }
  
  console.log('❓ Classified as: unknown');
  return 'unknown';
}

function extractLinkedInProfile() {
  try {
    const data = {
      personName: '',
      profileUrl: window.location.href,
      currentTitle: '',
      currentCompany: '',
      location: '',
      headline: '',
      about: '',
      experiences: []
    };

    // Extract person name - try multiple selectors
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1[data-anonymize="person-name"]',
      '.pv-text-details__left-panel h1',
      '.ph5 h1'
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = document.querySelector(selector);
      if (nameEl && nameEl.textContent.trim()) {
        data.personName = nameEl.textContent.trim();
        break;
      }
    }

    // Extract headline/current title
    const headlineSelectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '.ph5 .text-body-medium'
    ];
    
    for (const selector of headlineSelectors) {
      const headlineEl = document.querySelector(selector);
      if (headlineEl && headlineEl.textContent.trim()) {
        data.headline = headlineEl.textContent.trim();
        break;
      }
    }

    // Extract location
    const locationSelectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      '.ph5 .text-body-small'
    ];
    
    for (const selector of locationSelectors) {
      const locationEl = document.querySelector(selector);
      if (locationEl && locationEl.textContent.trim()) {
        data.location = locationEl.textContent.trim();
        break;
      }
    }

    // Extract about section
    const aboutSelectors = [
      '.pv-shared-text-with-see-more .inline-show-more-text',
      '.pv-about-section .pv-about__summary-text',
      '[data-section="summary"] .inline-show-more-text'
    ];
    
    for (const selector of aboutSelectors) {
      const aboutEl = document.querySelector(selector);
      if (aboutEl && aboutEl.textContent.trim()) {
        data.about = aboutEl.textContent.trim();
        break;
      }
    }

    // Extract current experience/company
    const experienceSelectors = [
      '.pv-entity__summary-info h3',
      '.experience-item__title',
      '.pv-entity__summary-info-v2 h3'
    ];
    
    for (const selector of experienceSelectors) {
      const titleEl = document.querySelector(selector);
      if (titleEl && titleEl.textContent.trim()) {
        data.currentTitle = titleEl.textContent.trim();
        
        // Try to find company name
        const companyEl = titleEl.parentElement?.querySelector('.pv-entity__secondary-title') ||
                         titleEl.parentElement?.querySelector('.experience-item__subtitle');
        if (companyEl) {
          data.currentCompany = companyEl.textContent.trim();
        }
        break;
      }
    }

    // Extract experiences
    const experienceItems = document.querySelectorAll('.pv-profile-section__list-item, .experience-item');
    data.experiences = Array.from(experienceItems).slice(0, 3).map(item => {
      const title = item.querySelector('h3, .experience-item__title')?.textContent?.trim() || '';
      const company = item.querySelector('.pv-entity__secondary-title, .experience-item__subtitle')?.textContent?.trim() || '';
      const duration = item.querySelector('.pv-entity__bullet-item, .experience-item__duration')?.textContent?.trim() || '';
      
      return { title, company, duration, description: '' };
    }).filter(exp => exp.title || exp.company);

    return data;
  } catch (error) {
    console.error('Error extracting LinkedIn profile:', error);
    return {
      personName: document.title.split(' | ')[0] || '',
      profileUrl: window.location.href,
      currentTitle: '',
      currentCompany: '',
      location: '',
      headline: '',
      about: '',
      experiences: []
    };
  }
}

function extractJobPosting(url) {
  try {
    console.log('💼 Extracting job posting from:', url);
    
    const data = {
      jobTitle: '',
      companyName: '',
      platform: extractPlatform(url),
      jobUrl: url,
      location: '',
      postedDate: '',
      applicationStatus: 'viewed'
    };

    // LinkedIn Jobs - Updated selectors
    if (url.includes('linkedin.com/jobs/')) {
      console.log('🔍 Extracting LinkedIn job...');
      
      // Try multiple selectors for job title
      const titleSelectors = [
        '.top-card-layout__title',
        '.jobs-unified-top-card__job-title',
        '.job-details-jobs-unified-top-card__job-title',
        'h1[data-test-id="job-title"]',
        'h1.job-title',
        'h1'
      ];
      
      for (const selector of titleSelectors) {
        const titleEl = document.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
          data.jobTitle = titleEl.textContent.trim();
          console.log('✅ Found job title:', data.jobTitle);
          break;
        }
      }
      
      // Try multiple selectors for company name
      const companySelectors = [
        '.jobs-unified-top-card__company-name',
        '.top-card-layout__card .top-card-layout__second-subline a',
        '.job-details-jobs-unified-top-card__company-name',
        '[data-test-id="job-company"]',
        '.company-name'
      ];
      
      for (const selector of companySelectors) {
        const companyEl = document.querySelector(selector);
        if (companyEl && companyEl.textContent.trim()) {
          data.companyName = companyEl.textContent.trim();
          console.log('✅ Found company:', data.companyName);
          break;
        }
      }
      
      // Try multiple selectors for location
      const locationSelectors = [
        '.jobs-unified-top-card__bullet',
        '.top-card-layout__card .top-card-layout__third-subline',
        '.job-details-jobs-unified-top-card__primary-description',
        '[data-test-id="job-location"]'
      ];
      
      for (const selector of locationSelectors) {
        const locationEl = document.querySelector(selector);
        if (locationEl && locationEl.textContent.trim()) {
          data.location = locationEl.textContent.trim();
          console.log('✅ Found location:', data.location);
          break;
        }
      }
    }
    // Indeed
    else if (url.includes('indeed.com')) {
      console.log('🔍 Extracting Indeed job...');
      
      const titleSelectors = [
        '[data-jk] h1',
        '.jobsearch-JobInfoHeader-title',
        'h1[data-testid="jobTitle"]',
        'h1.jobTitle'
      ];
      
      for (const selector of titleSelectors) {
        const titleEl = document.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
          data.jobTitle = titleEl.textContent.trim();
          break;
        }
      }
      
      const companySelectors = [
        '[data-testid="inlineHeader-companyName"]',
        '.icl-u-lg-mr--sm',
        '[data-testid="companyName"]',
        '.companyName'
      ];
      
      for (const selector of companySelectors) {
        const companyEl = document.querySelector(selector);
        if (companyEl && companyEl.textContent.trim()) {
          data.companyName = companyEl.textContent.trim();
          break;
        }
      }
      
      const locationSelectors = [
        '[data-testid="job-location"]',
        '.icl-u-xs-mt--xs',
        '[data-testid="jobLocation"]'
      ];
      
      for (const selector of locationSelectors) {
        const locationEl = document.querySelector(selector);
        if (locationEl && locationEl.textContent.trim()) {
          data.location = locationEl.textContent.trim();
          break;
        }
      }
    }
    // Greenhouse
    else if (url.includes('greenhouse.io')) {
      console.log('🔍 Extracting Greenhouse job...');
      data.jobTitle = document.querySelector('.app-title, h1')?.textContent?.trim() || '';
      data.companyName = document.querySelector('.company-name, .header .company')?.textContent?.trim() || '';
      data.location = document.querySelector('.location, .app-location')?.textContent?.trim() || '';
    }
    // Generic fallback - Enhanced
    else {
      console.log('🔍 Extracting generic job...');
      
      // Enhanced job title extraction
      const titleSelectors = [
        'h1',
        '[class*="job-title"]',
        '[class*="title"]',
        '[id*="job-title"]',
        '[id*="title"]'
      ];
      
      for (const selector of titleSelectors) {
        const titleEl = document.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
          data.jobTitle = titleEl.textContent.trim();
          break;
        }
      }
      
      if (!data.jobTitle) {
        data.jobTitle = document.title;
      }
      
      // Enhanced company name extraction
      const companySelectors = [
        '.company', '.employer', '[class*="company"]', '[class*="employer"]',
        '[data-company]', '[class*="organization"]', '.org-name'
      ];
      
      for (const selector of companySelectors) {
        const companyEl = document.querySelector(selector);
        if (companyEl && companyEl.textContent.trim()) {
          data.companyName = companyEl.textContent.trim();
          break;
        }
      }
      
      // Enhanced location extraction
      const locationSelectors = [
        '.location', '[class*="location"]', '.address', '[class*="address"]',
        '[data-location]', '.city', '.region'
      ];
      
      for (const selector of locationSelectors) {
        const locationEl = document.querySelector(selector);
        if (locationEl && locationEl.textContent.trim()) {
          data.location = locationEl.textContent.trim();
          break;
        }
      }
    }

    // Fallback to meta tags if extraction failed
    if (!data.jobTitle) {
      data.jobTitle = document.querySelector('meta[property="og:title"]')?.content || 
                     document.querySelector('meta[name="title"]')?.content || 
                     document.title;
      console.log('📄 Using meta/title fallback for job title:', data.jobTitle);
    }
    
    if (!data.companyName) {
      data.companyName = document.querySelector('meta[property="og:site_name"]')?.content || 
                        document.querySelector('meta[name="author"]')?.content || '';
      console.log('📄 Using meta fallback for company:', data.companyName);
    }

    // Clean up extracted data
    data.jobTitle = data.jobTitle.replace(/\s+/g, ' ').trim();
    data.companyName = data.companyName.replace(/\s+/g, ' ').trim();
    data.location = data.location.replace(/\s+/g, ' ').trim();

    console.log('💼 Extracted job data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error extracting job posting:', error);
    return {
      jobTitle: document.title,
      companyName: '',
      platform: extractPlatform(url),
      jobUrl: url,
      location: '',
      postedDate: '',
      applicationStatus: 'viewed'
    };
  }
}

function extractGenericData() {
  return {
    title: document.title,
    url: window.location.href,
    description: document.querySelector('meta[name="description"]')?.content || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.content || ''
  };
}

function extractPlatform(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed.com')) return 'indeed';
    if (hostname.includes('greenhouse.io')) return 'greenhouse';
    if (hostname.includes('lever.co')) return 'lever';
    if (hostname.includes('workday.com')) return 'workday';
    if (hostname.includes('wellfound.com')) return 'wellfound';
    if (hostname.includes('glassdoor.com')) return 'glassdoor';
    
    return hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function getLinkedInConversationContext() {
  try {
    if (!window.location.href.includes('linkedin.com/messaging/')) {
      return null;
    }

    const messages = [];
    const messageElements = document.querySelectorAll('.msg-s-message-list__event, .msg-s-event-listitem');
    
    // Get last 10 messages
    const recentMessages = Array.from(messageElements).slice(-10);
    
    for (const msgEl of recentMessages) {
      const senderEl = msgEl.querySelector('.msg-s-message-group__name, .msg-s-event-listitem__name');
      const contentEl = msgEl.querySelector('.msg-s-event-listitem__body, .msg-s-message-group__message');
      
      if (senderEl && contentEl) {
        messages.push({
          speaker: senderEl.textContent.trim(),
          content: contentEl.textContent.trim(),
          timestamp: new Date().toISOString()
        });
      }
    }

    return messages.length > 0 ? messages : null;
  } catch (error) {
    console.error('Error extracting conversation context:', error);
    return null;
  }
}

console.log('LinkedIn Job Tracker content script loaded');
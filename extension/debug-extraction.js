// Debug script to test job extraction
console.log('🔍 Debug extraction script loaded');

// Test job extraction on current page
function debugJobExtraction() {
  const url = window.location.href;
  const title = document.title;
  
  console.log('🌐 Current URL:', url);
  console.log('📄 Page title:', title);
  
  // Test the classification
  const classification = classifyPage(url, title);
  console.log('🏷️ Classification:', classification);
  
  if (classification === 'job_application') {
    console.log('💼 Extracting job data...');
    const jobData = extractJobPosting(url);
    console.log('📊 Extracted job data:', jobData);
    
    // Test validation
    console.log('🔍 Validation check:');
    console.log('- Job title valid:', jobData.jobTitle && jobData.jobTitle.length > 0);
    console.log('- Company name valid:', jobData.companyName && jobData.companyName.length > 0);
    console.log('- Job URL valid:', jobData.jobUrl && jobData.jobUrl.length > 0);
    
    return jobData;
  } else {
    console.log('❌ Page not classified as job application');
    return null;
  }
}

// Copy the classification and extraction functions from content.js
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

function extractJobPosting(url) {
  console.log('💼 Starting job extraction for:', url);
  
  const data = {
    jobTitle: '',
    companyName: '',
    platform: extractPlatform(url),
    jobUrl: url,
    location: '',
    postedDate: '',
    applicationStatus: 'viewed'
  };

  // LinkedIn Jobs - Enhanced selectors
  if (url.includes('linkedin.com/jobs/')) {
    console.log('🔍 Extracting LinkedIn job...');
    
    // Job title selectors
    const titleSelectors = [
      '.top-card-layout__title',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title',
      'h1[data-test-id="job-title"]',
      'h1.job-title',
      '.jobs-search__job-title--link',
      '.jobs-details__main-content h1',
      '.job-details-jobs-unified-top-card__job-title-link',
      'h1[class*="job-title"]',
      'h1[class*="title"]',
      'h1'
    ];
    
    console.log('🔍 Trying title selectors...');
    for (const selector of titleSelectors) {
      const titleEl = document.querySelector(selector);
      console.log(`- Selector "${selector}":`, titleEl ? titleEl.textContent.trim() : 'not found');
      if (titleEl && titleEl.textContent.trim()) {
        data.jobTitle = titleEl.textContent.trim();
        console.log('✅ Found job title:', data.jobTitle);
        break;
      }
    }
    
    // Company name selectors
    const companySelectors = [
      '.jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.top-card-layout__card .top-card-layout__second-subline a',
      '.job-details-jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__company-name a',
      '[data-test-id="job-company"]',
      '.company-name',
      '.jobs-search__job-company--link',
      '.jobs-details__main-content .jobs-unified-top-card__company-name',
      'a[class*="company"]',
      '[class*="company-name"]'
    ];
    
    console.log('🔍 Trying company selectors...');
    for (const selector of companySelectors) {
      const companyEl = document.querySelector(selector);
      console.log(`- Selector "${selector}":`, companyEl ? companyEl.textContent.trim() : 'not found');
      if (companyEl && companyEl.textContent.trim()) {
        data.companyName = companyEl.textContent.trim();
        console.log('✅ Found company:', data.companyName);
        break;
      }
    }
  }

  // Fallback to meta tags if extraction failed
  if (!data.jobTitle) {
    const metaTitle = document.querySelector('meta[property="og:title"]')?.content || 
                     document.querySelector('meta[name="title"]')?.content || 
                     document.title;
    data.jobTitle = metaTitle;
    console.log('📄 Using meta/title fallback for job title:', data.jobTitle);
  }
  
  if (!data.companyName) {
    const metaCompany = document.querySelector('meta[property="og:site_name"]')?.content || 
                       document.querySelector('meta[name="author"]')?.content || '';
    data.companyName = metaCompany;
    console.log('📄 Using meta fallback for company:', data.companyName);
  }

  console.log('💼 Final extracted job data:', data);
  return data;
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

// Run the debug extraction
console.log('🚀 Running debug extraction...');
const result = debugJobExtraction();
console.log('🎯 Debug extraction complete:', result);
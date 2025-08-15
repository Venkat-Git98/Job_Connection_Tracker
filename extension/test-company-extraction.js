// Test script for LinkedIn company extraction
console.log('🏢 Testing LinkedIn company extraction...');

// Test company extraction on current page
function testCompanyExtraction() {
  const url = window.location.href;
  const title = document.title;
  
  console.log('🌐 Current URL:', url);
  console.log('📄 Page title:', title);
  
  // Test classification
  const isCompanyPage = url.includes('linkedin.com/company/') || 
                       title.toLowerCase().includes('linkedin') ||
                       document.querySelector('[data-test-id="org-name"]');
  
  console.log('🏷️ Is company page:', isCompanyPage);
  
  if (isCompanyPage) {
    // Test company data extraction
    const companyData = {
      companyName: '',
      companyUrl: url,
      industry: '',
      location: '',
      employeeCount: '',
      description: '',
      website: '',
      founded: ''
    };

    // Extract company name
    const nameSelectors = [
      'h1[data-test-id="org-name"]',
      'h1.org-top-card-summary__title',
      '.org-top-card-summary__title',
      'h1.t-24.t-black.t-normal',
      'h1'
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = document.querySelector(selector);
      if (nameEl && nameEl.textContent.trim()) {
        companyData.companyName = nameEl.textContent.trim();
        console.log('✅ Found company name:', companyData.companyName);
        break;
      }
    }

    // Extract industry
    const industryEl = document.querySelector('[data-test-id="org-industry"]');
    if (industryEl) {
      companyData.industry = industryEl.textContent.trim();
      console.log('✅ Found industry:', companyData.industry);
    }

    // Extract location
    const locationEl = document.querySelector('[data-test-id="org-location"]');
    if (locationEl) {
      companyData.location = locationEl.textContent.trim();
      console.log('✅ Found location:', companyData.location);
    }

    // Extract employee count
    const employeeEl = document.querySelector('[data-test-id="org-employees"]');
    if (employeeEl) {
      companyData.employeeCount = employeeEl.textContent.trim();
      console.log('✅ Found employee count:', companyData.employeeCount);
    }

    // Extract description
    const descEl = document.querySelector('.org-about-us-organization-description__text');
    if (descEl) {
      companyData.description = descEl.textContent.trim();
      console.log('✅ Found description:', companyData.description.substring(0, 100) + '...');
    }

    // Extract website
    const websiteEl = document.querySelector('a[data-test-id="org-website-url"]');
    if (websiteEl) {
      companyData.website = websiteEl.href;
      console.log('✅ Found website:', companyData.website);
    }

    // Extract founded year
    const foundedEl = document.querySelector('[data-test-id="org-founded"]');
    if (foundedEl) {
      const foundedText = foundedEl.textContent.trim();
      const yearMatch = foundedText.match(/\d{4}/);
      if (yearMatch) {
        companyData.founded = yearMatch[0];
        console.log('✅ Found founded year:', companyData.founded);
      }
    }

    // Fallback to page title if company name not found
    if (!companyData.companyName) {
      const titleParts = document.title.split('|')[0].trim();
      companyData.companyName = titleParts || 'Unknown Company';
      console.log('📄 Using title fallback for company name:', companyData.companyName);
    }

    console.log('🏢 Final extracted company data:', companyData);
    
    // Validate data
    const isValid = companyData.companyName && 
                   companyData.companyName.length >= 2 && 
                   companyData.companyUrl;
    
    console.log('🎯 Data is valid:', isValid);
    
    return { companyData, isValid };
  }
  
  return null;
}

// Test the extraction
const result = testCompanyExtraction();

if (result) {
  console.log('✅ Company extraction test completed successfully');
  console.log('📊 Results:', result);
  
  if (result.isValid) {
    console.log('🎉 Company data is ready to be sent to backend!');
  } else {
    console.log('⚠️ Company data needs improvement');
  }
} else {
  console.log('❌ This page is not recognized as a company page');
}

// Export for testing
window.testCompanyExtraction = testCompanyExtraction;
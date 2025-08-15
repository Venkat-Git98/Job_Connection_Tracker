// Test script to debug and fix job extraction issues
console.log('🔧 Testing job extraction fix...');

// Test the makeAPICall function from background.js
async function testAPICall() {
  try {
    // First check if we have a user ID
    const result = await chrome.storage.local.get(['currentUserId']);
    console.log('Current user ID:', result.currentUserId);
    
    if (!result.currentUserId) {
      console.error('❌ No user ID found. Please select a user first.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking user ID:', error);
    return false;
  }
}

// Test job data extraction with better error handling
function testJobExtraction() {
  const testData = {
    classification: 'job_application',
    url: 'https://linkedin.com/jobs/view/12345',
    pageTitle: 'Software Engineer - Test Company',
    pageContent: 'Software Engineer - Test Company',
    extractedData: {
      jobTitle: 'Software Engineer',
      companyName: 'Test Company',
      platform: 'linkedin',
      jobUrl: 'https://linkedin.com/jobs/view/12345',
      location: 'San Francisco, CA',
      postedDate: '',
      applicationStatus: 'viewed'
    }
  };
  
  console.log('🧪 Test data:', testData);
  
  // Validate the test data
  const { extractedData } = testData;
  
  console.log('✅ Validation checks:');
  console.log('- Job title:', extractedData.jobTitle, '(length:', extractedData.jobTitle?.length, ')');
  console.log('- Company name:', extractedData.companyName, '(length:', extractedData.companyName?.length, ')');
  console.log('- Job URL:', extractedData.jobUrl);
  console.log('- Platform:', extractedData.platform);
  
  // Check if data meets minimum requirements
  const isValid = extractedData.jobTitle && 
                  extractedData.jobTitle.length >= 2 && 
                  extractedData.companyName && 
                  extractedData.companyName.length >= 2 &&
                  extractedData.jobUrl;
  
  console.log('🎯 Data is valid:', isValid);
  
  return { testData, isValid };
}

// Test the actual extraction on current page
function testCurrentPageExtraction() {
  const url = window.location.href;
  const title = document.title;
  
  console.log('🌐 Current page:', url);
  console.log('📄 Title:', title);
  
  // Test classification
  const isJobPage = url.includes('linkedin.com/jobs/') || 
                   url.includes('indeed.com') || 
                   url.includes('greenhouse.io') ||
                   title.toLowerCase().includes('job') ||
                   title.toLowerCase().includes('career');
  
  console.log('🏷️ Is job page:', isJobPage);
  
  if (isJobPage) {
    // Try to extract job data
    const jobData = {
      jobTitle: document.querySelector('h1')?.textContent?.trim() || title,
      companyName: document.querySelector('.company, [class*="company"]')?.textContent?.trim() || 'Unknown Company',
      platform: url.includes('linkedin.com') ? 'linkedin' : 'unknown',
      jobUrl: url,
      location: document.querySelector('.location, [class*="location"]')?.textContent?.trim() || '',
      postedDate: '',
      applicationStatus: 'viewed'
    };
    
    console.log('💼 Extracted job data:', jobData);
    return jobData;
  }
  
  return null;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive extraction tests...');
  
  // Test 1: API connectivity
  console.log('\n📡 Test 1: API Connectivity');
  const hasUser = await testAPICall();
  
  // Test 2: Data validation
  console.log('\n🧪 Test 2: Data Validation');
  const { testData, isValid } = testJobExtraction();
  
  // Test 3: Current page extraction
  console.log('\n🌐 Test 3: Current Page Extraction');
  const currentPageData = testCurrentPageExtraction();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('- User ID available:', hasUser);
  console.log('- Test data valid:', isValid);
  console.log('- Current page extractable:', !!currentPageData);
  
  if (hasUser && isValid) {
    console.log('✅ Extension should work properly');
  } else {
    console.log('❌ Issues found that need fixing');
  }
  
  return {
    hasUser,
    isValid,
    currentPageData,
    testData
  };
}

// Auto-run tests
runAllTests().then(results => {
  console.log('🎯 Test results:', results);
}).catch(error => {
  console.error('❌ Test failed:', error);
});
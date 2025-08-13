// Manual testing script for Chrome extension
// Run this in browser console on LinkedIn pages

console.log('🧪 Testing LinkedIn Job Tracker Extension');

// Test page classification
function testPageClassification() {
  console.log('📋 Testing page classification...');
  
  const url = window.location.href;
  const title = document.title;
  
  console.log('Current URL:', url);
  console.log('Page Title:', title);
  
  // Test classification logic
  if (url.includes('linkedin.com/in/')) {
    console.log('✅ Detected: LinkedIn Profile');
    return 'linkedin_profile';
  } else if (url.includes('linkedin.com/jobs/')) {
    console.log('✅ Detected: LinkedIn Job');
    return 'job_application';
  } else {
    console.log('❓ Detected: Unknown page type');
    return 'unknown';
  }
}

// Test LinkedIn profile extraction
function testLinkedInProfileExtraction() {
  console.log('👤 Testing LinkedIn profile extraction...');
  
  const data = {
    personName: '',
    profileUrl: window.location.href,
    currentTitle: '',
    currentCompany: '',
    location: '',
    headline: '',
    about: ''
  };

  // Test name extraction
  const nameSelectors = [
    'h1.text-heading-xlarge',
    'h1[data-anonymize="person-name"]',
    '.pv-text-details__left-panel h1'
  ];
  
  for (const selector of nameSelectors) {
    const nameEl = document.querySelector(selector);
    if (nameEl && nameEl.textContent.trim()) {
      data.personName = nameEl.textContent.trim();
      console.log('✅ Name found:', data.personName);
      break;
    }
  }

  // Test headline extraction
  const headlineSelectors = [
    '.text-body-medium.break-words',
    '.pv-text-details__left-panel .text-body-medium'
  ];
  
  for (const selector of headlineSelectors) {
    const headlineEl = document.querySelector(selector);
    if (headlineEl && headlineEl.textContent.trim()) {
      data.headline = headlineEl.textContent.trim();
      console.log('✅ Headline found:', data.headline);
      break;
    }
  }

  console.log('📊 Extracted profile data:', data);
  return data;
}

// Test job posting extraction
function testJobPostingExtraction() {
  console.log('💼 Testing job posting extraction...');
  
  const data = {
    jobTitle: '',
    companyName: '',
    platform: 'linkedin',
    jobUrl: window.location.href,
    location: ''
  };

  // Test job title extraction
  const titleSelectors = [
    '.top-card-layout__title',
    '.jobs-unified-top-card__job-title',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    const titleEl = document.querySelector(selector);
    if (titleEl && titleEl.textContent.trim()) {
      data.jobTitle = titleEl.textContent.trim();
      console.log('✅ Job title found:', data.jobTitle);
      break;
    }
  }

  // Test company extraction
  const companySelectors = [
    '.top-card-layout__card .top-card-layout__second-subline a',
    '.jobs-unified-top-card__company-name'
  ];
  
  for (const selector of companySelectors) {
    const companyEl = document.querySelector(selector);
    if (companyEl && companyEl.textContent.trim()) {
      data.companyName = companyEl.textContent.trim();
      console.log('✅ Company found:', data.companyName);
      break;
    }
  }

  console.log('📊 Extracted job data:', data);
  return data;
}

// Test conversation context extraction
function testConversationExtraction() {
  console.log('💬 Testing conversation context extraction...');
  
  if (!window.location.href.includes('linkedin.com/messaging/')) {
    console.log('❌ Not on LinkedIn messaging page');
    return null;
  }

  const messages = [];
  const messageElements = document.querySelectorAll('.msg-s-message-list__event, .msg-s-event-listitem');
  
  console.log(`Found ${messageElements.length} message elements`);
  
  const recentMessages = Array.from(messageElements).slice(-5);
  
  for (const msgEl of recentMessages) {
    const senderEl = msgEl.querySelector('.msg-s-message-group__name, .msg-s-event-listitem__name');
    const contentEl = msgEl.querySelector('.msg-s-event-listitem__body, .msg-s-message-group__message');
    
    if (senderEl && contentEl) {
      const message = {
        speaker: senderEl.textContent.trim(),
        content: contentEl.textContent.trim(),
        timestamp: new Date().toISOString()
      };
      messages.push(message);
      console.log('✅ Message found:', message);
    }
  }

  console.log('📊 Extracted conversation context:', messages);
  return messages;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all extension tests...');
  
  const pageType = testPageClassification();
  
  if (pageType === 'linkedin_profile') {
    testLinkedInProfileExtraction();
  } else if (pageType === 'job_application') {
    testJobPostingExtraction();
  }
  
  testConversationExtraction();
  
  console.log('✅ All tests completed!');
}

// Auto-run tests
runAllTests();

// Make functions available globally for manual testing
window.testExtension = {
  testPageClassification,
  testLinkedInProfileExtraction,
  testJobPostingExtraction,
  testConversationExtraction,
  runAllTests
};

console.log('💡 Use window.testExtension.runAllTests() to run tests again');
console.log('💡 Individual test functions are available in window.testExtension');
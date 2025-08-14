// Content script for LinkedIn Job Tracker extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received message:', request.action);
  
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
    try {
      const context = getLinkedInConversationContext();
      sendResponse({ context });
    } catch (error) {
      sendResponse({ context: null, error: error.message });
    }
    return true;
  }
  
  if (request.action === 'extractLinkedInConversations') {
    console.log('🔍 Starting conversation extraction...');
    console.log('Current URL:', window.location.href);
    console.log('Page title:', document.title);
    
    try {
      const conversations = extractLinkedInConversations();
      console.log('✅ Extraction successful:', conversations);
      sendResponse({ conversations });
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      sendResponse({ conversations: [], error: error.message });
    }
    return true;
  }
  
  if (request.action === 'getConversationHistory') {
    console.log('📜 Starting history extraction for index:', request.conversationIndex);
    
    try {
      const messages = getConversationHistory(request.conversationIndex);
      console.log('✅ History extraction successful:', messages.length, 'messages');
      sendResponse({ messages });
    } catch (error) {
      console.error('❌ History extraction failed:', error);
      sendResponse({ messages: [], error: error.message });
    }
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

function extractLinkedInConversations() {
  try {
    console.log('🔍 Extracting LinkedIn conversations...');
    
    if (!window.location.href.includes('linkedin.com')) {
      throw new Error('Not on LinkedIn');
    }

    const conversations = [];
    
    // Check for LinkedIn messaging sidebar (right panel)
    console.log('🔍 Looking for messaging sidebar...');
    
    // Look for the messaging sidebar container - based on your DOM output
    const messagingSidebar = document.querySelector('.msg-overlay-list-bubble');
    
    if (messagingSidebar) {
      console.log('📱 Found messaging sidebar (.msg-overlay-list-bubble)');
      
      // Look for conversation list items - these are the actual conversation links
      const conversationItems = messagingSidebar.querySelectorAll('.msg-conversation-listitem__link');
      
      console.log(`Found ${conversationItems.length} conversation items in sidebar`);
      
      if (conversationItems.length > 0) {
        Array.from(conversationItems).slice(0, 10).forEach((item, index) => {
          try {
            // Extract person name - based on your DOM structure
            const nameEl = item.querySelector('.msg-conversation-listitem__participant-names') ||
                          item.querySelector('.msg-conversation-card__participant-names') ||
                          item.querySelector('h3');
            
            let personName = '';
            if (nameEl && nameEl.textContent.trim()) {
              personName = nameEl.textContent.trim();
              console.log(`✅ Found name: ${personName}`);
            }
            
            // Extract last message snippet
            const messageEl = item.querySelector('.msg-overlay-list-bubble__message-snippet--v2') ||
                             item.querySelector('.msg-conversation-listitem__summary') ||
                             item.querySelector('.msg-conversation-card__summary');
            
            let lastMessage = '';
            if (messageEl && messageEl.textContent.trim()) {
              lastMessage = messageEl.textContent.trim();
            }
            
            if (personName) {
              conversations.push({
                personName,
                lastMessage: lastMessage || 'No recent messages',
                element: item,
                index: index,
                source: 'sidebar'
              });
              
              console.log(`✅ Added conversation: ${personName}`);
            }
          } catch (error) {
            console.error('Error extracting conversation from sidebar:', error);
          }
        });
      } else {
        console.log('❌ No conversation items found in sidebar');
        
        // Debug: Let's see what's actually in the sidebar
        const allChildren = messagingSidebar.querySelectorAll('*');
        console.log(`Sidebar contains ${allChildren.length} total elements`);
        
        // Look for any elements that might contain names
        const potentialNameElements = messagingSidebar.querySelectorAll('h3, .t-14, .t-16, [class*="participant"], [class*="name"]');
        console.log(`Found ${potentialNameElements.length} potential name elements`);
        
        potentialNameElements.forEach((el, i) => {
          if (i < 5) { // Show first 5
            console.log(`  Name element ${i}: ${el.className} - "${el.textContent.trim().substring(0, 50)}"`);
          }
        });
      }
    } else {
      console.log('❌ No messaging sidebar found');
    }
    
    // Check for active conversation in the message thread area
    if (conversations.length === 0) {
      console.log('🔍 Looking for active conversation thread...');
      
      // Look for message thread container
      const messageThread = document.querySelector('.msg-s-message-list') ||
                           document.querySelector('.message-thread') ||
                           document.querySelector('[data-view-name="message-thread"]');
      
      if (messageThread) {
        console.log('📱 Found message thread');
        
        // Extract participant names from message headers
        const messageItems = messageThread.querySelectorAll('.msg-s-event-listitem') ||
                            messageThread.querySelectorAll('.message-item');
        
        const participantNames = new Set();
        
        messageItems.forEach(item => {
          const nameSelectors = [
            '.msg-s-message-group__name',
            '.message-sender-name',
            '.sender-name'
          ];
          
          nameSelectors.forEach(selector => {
            const nameEl = item.querySelector(selector);
            if (nameEl && nameEl.textContent.trim()) {
              const name = nameEl.textContent.trim();
              // Filter out current user (Venkatesh S)
              if (name && !name.includes('Venkatesh S')) {
                participantNames.add(name);
              }
            }
          });
        });
        
        // Get the last message for context
        const lastMessageEl = messageThread.querySelector('.msg-s-event-listitem:last-child .msg-s-event-listitem__body') ||
                             messageThread.querySelector('.message-item:last-child .message-content');
        const lastMessage = lastMessageEl ? lastMessageEl.textContent.trim().substring(0, 100) + '...' : 'Active conversation';
        
        // Add each participant as a conversation
        participantNames.forEach(name => {
          conversations.push({
            personName: name,
            lastMessage: lastMessage,
            isActiveConversation: true,
            source: 'thread'
          });
        });
      }
    }
    
    // Fallback: Look for any messaging interface elements
    if (conversations.length === 0) {
      console.log('🔍 Looking for any messaging elements...');
      
      // Try to find any conversation-related elements
      const allConversationElements = document.querySelectorAll(
        '.msg-conversation-listitem, .conversation-item, [data-view-name*="conversation"], .msg-entity-lockup'
      );
      
      console.log(`Found ${allConversationElements.length} potential conversation elements`);
      
      Array.from(allConversationElements).slice(0, 5).forEach((element, index) => {
        try {
          // Extract any text that might be a person's name
          const textContent = element.textContent.trim();
          const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
          
          // Look for lines that might be names (short, capitalized)
          const potentialNames = lines.filter(line => 
            line.length > 2 && 
            line.length < 50 && 
            /^[A-Z]/.test(line) && 
            !line.includes('•') &&
            !line.includes('ago') &&
            !line.includes('AM') &&
            !line.includes('PM')
          );
          
          if (potentialNames.length > 0) {
            conversations.push({
              personName: potentialNames[0],
              lastMessage: lines[1] || 'Found conversation',
              element: element,
              index: index,
              source: 'fallback'
            });
          }
        } catch (error) {
          console.error('Error in fallback extraction:', error);
        }
      });
    }
    
    if (conversations.length === 0) {
      throw new Error('No conversations found. Please open LinkedIn messaging or navigate to a conversation.');
    }
    
    console.log('💬 Extracted conversations:', conversations);
    return conversations;
    
  } catch (error) {
    console.error('❌ Error extracting LinkedIn conversations:', error);
    throw error;
  }
}

function getConversationHistory(conversationIndex) {
  try {
    console.log('📜 Getting conversation history for index:', conversationIndex);
    
    const messages = [];
    
    // For LinkedIn messaging sidebar, we need to look for the active conversation thread
    // This could be in several places depending on the interface
    
    // Method 1: Look for message thread in the main content area
    let messageContainer = document.querySelector('.msg-s-message-list-content') ||
                          document.querySelector('.msg-s-message-list') ||
                          document.querySelector('[data-view-name="message-thread"]');
    
    // Method 2: Look for message thread in overlay/popup
    if (!messageContainer) {
      messageContainer = document.querySelector('.msg-overlay-conversation-bubble .msg-s-message-list-content') ||
                        document.querySelector('.msg-overlay-conversation-bubble .msg-s-message-list');
    }
    
    // Method 3: Look for any message container
    if (!messageContainer) {
      messageContainer = document.querySelector('[class*="message-list"]') ||
                        document.querySelector('[class*="msg-s-message"]');
    }
    
    if (!messageContainer) {
      console.log('❌ No message container found');
      console.log('🔍 Available message-related elements:');
      const msgElements = document.querySelectorAll('[class*="msg"], [class*="message"]');
      console.log(`Found ${msgElements.length} message-related elements`);
      return [];
    }
    
    console.log('✅ Found message container:', messageContainer.className);
    
    // Get all message events/items
    const messageSelectors = [
      '.msg-s-message-list__event',
      '.msg-s-event-listitem',
      '.message-item',
      '[class*="message-event"]',
      '[class*="event-listitem"]'
    ];
    
    let messageElements = [];
    for (const selector of messageSelectors) {
      messageElements = messageContainer.querySelectorAll(selector);
      if (messageElements.length > 0) {
        console.log(`📨 Found ${messageElements.length} messages using selector: ${selector}`);
        break;
      }
    }
    
    if (messageElements.length === 0) {
      console.log('❌ No message elements found');
      return [];
    }
    
    Array.from(messageElements).forEach((eventEl, index) => {
      try {
        // Skip time headers and other non-message elements
        if (eventEl.querySelector('.msg-s-message-list__time-heading') ||
            eventEl.querySelector('[class*="time-heading"]')) {
          return;
        }
        
        // Get the message item (might be the element itself or a child)
        const messageItem = eventEl.querySelector('.msg-s-event-listitem') || eventEl;
        
        // Get sender name with multiple selectors
        const senderSelectors = [
          '.msg-s-message-group__name',
          '.msg-s-message-group__profile-link',
          '.message-sender-name',
          '.sender-name',
          '[class*="message-group__name"]'
        ];
        
        let senderName = 'Unknown';
        for (const selector of senderSelectors) {
          const senderEl = messageItem.querySelector(selector);
          if (senderEl && senderEl.textContent.trim()) {
            senderName = senderEl.textContent.trim();
            break;
          }
        }
        
        // Get message content with multiple selectors
        const contentSelectors = [
          '.msg-s-event-listitem__body',
          '.msg-s-message-group__message',
          '.message-content',
          '.message-body',
          '[class*="event-listitem__body"]',
          '[class*="message-group__message"]'
        ];
        
        let content = '';
        for (const selector of contentSelectors) {
          const contentEl = messageItem.querySelector(selector);
          if (contentEl && contentEl.textContent.trim()) {
            content = contentEl.textContent.trim();
            break;
          }
        }
        
        if (!content) {
          // Fallback: try to get any text content that looks like a message
          const allText = messageItem.textContent.trim();
          const lines = allText.split('\n').map(line => line.trim()).filter(line => line);
          
          // Look for lines that might be message content (not names, timestamps, etc.)
          const potentialContent = lines.find(line => 
            line.length > 10 && 
            !line.includes('AM') && 
            !line.includes('PM') && 
            !line.match(/^\d+:\d+/) &&
            !line.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) // Skip names like "John Doe"
          );
          
          if (potentialContent) {
            content = potentialContent;
          }
        }
        
        if (!content) return; // Skip if no content found
        
        // Determine if message was sent by current user
        const isSent = senderName.includes('Venkatesh S') || 
                      messageItem.classList.contains('msg-s-event-listitem--other') === false ||
                      content.startsWith('You:');
        
        // Get timestamp
        const timestampSelectors = [
          '.msg-s-message-group__timestamp',
          '.message-timestamp',
          '.timestamp',
          '[class*="timestamp"]'
        ];
        
        let timestamp = new Date().toISOString();
        for (const selector of timestampSelectors) {
          const timestampEl = messageItem.querySelector(selector);
          if (timestampEl && timestampEl.textContent.trim()) {
            timestamp = timestampEl.textContent.trim();
            break;
          }
        }
        
        messages.push({
          content: content,
          isSent: isSent,
          sender: senderName,
          timestamp: timestamp,
          index: index
        });
        
        console.log(`📝 Message ${index}: ${senderName} - ${content.substring(0, 50)}...`);
        
      } catch (error) {
        console.error('Error extracting individual message:', error);
      }
    });
    
    // Sort messages chronologically (oldest first)
    messages.sort((a, b) => a.index - b.index);
    
    console.log(`📜 Extracted ${messages.length} messages from conversation`);
    
    // Log sample messages for debugging
    if (messages.length > 0) {
      console.log('Sample messages:');
      messages.slice(-3).forEach((msg, i) => {
        console.log(`  ${i}: ${msg.sender} - ${msg.content.substring(0, 100)}...`);
      });
    }
    
    return messages;
    
  } catch (error) {
    console.error('❌ Error getting conversation history:', error);
    return [];
  }
}

console.log('LinkedIn Job Tracker content script loaded');
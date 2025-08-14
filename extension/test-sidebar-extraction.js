// Test script for LinkedIn messaging sidebar extraction
// Run this in the browser console on your LinkedIn page with messaging sidebar open

console.log('🧪 Testing LinkedIn Messaging Sidebar Extraction...');

// Test 1: Look for messaging sidebar
console.log('\n1️⃣ Testing messaging sidebar detection...');

const sidebarSelectors = [
  '[data-view-name="messaging-tab"]',
  '.msg-overlay-list-bubble',
  '.messaging-tab',
  '.msg-overlay-bubble-header'
];

let messagingSidebar = null;
for (const selector of sidebarSelectors) {
  messagingSidebar = document.querySelector(selector);
  if (messagingSidebar) {
    console.log(`✅ Found messaging sidebar with selector: ${selector}`);
    break;
  } else {
    console.log(`❌ No sidebar found with: ${selector}`);
  }
}

if (!messagingSidebar) {
  console.log('🔍 Looking for any messaging-related elements...');
  const allMessagingElements = document.querySelectorAll('[class*="msg"], [class*="messaging"], [data-view-name*="msg"]');
  console.log(`Found ${allMessagingElements.length} messaging-related elements`);
  
  allMessagingElements.forEach((el, i) => {
    if (i < 5) { // Show first 5
      console.log(`  [${i}]: ${el.className} - ${el.tagName}`);
    }
  });
}

// Test 2: Look for conversation items
console.log('\n2️⃣ Testing conversation items detection...');

const conversationSelectors = [
  '[data-view-name="conversation-list-item"]',
  '.msg-conversation-listitem',
  '.conversation-item',
  '.msg-entity-lockup'
];

let conversationItems = [];
for (const selector of conversationSelectors) {
  conversationItems = document.querySelectorAll(selector);
  if (conversationItems.length > 0) {
    console.log(`✅ Found ${conversationItems.length} conversation items with: ${selector}`);
    break;
  } else {
    console.log(`❌ No conversation items with: ${selector}`);
  }
}

// Test 3: Extract names from conversation items
if (conversationItems.length > 0) {
  console.log('\n3️⃣ Testing name extraction from conversation items...');
  
  Array.from(conversationItems).slice(0, 3).forEach((item, index) => {
    console.log(`\nConversation item ${index}:`);
    console.log('  Full text:', item.textContent.trim().substring(0, 100) + '...');
    
    const nameSelectors = [
      '.msg-conversation-listitem__participant-names',
      '.msg-conversation-card__participant-names', 
      '.msg-entity-lockup__entity-title',
      'h3',
      '.t-14.t-bold',
      '.conversation-participant-name'
    ];
    
    let foundName = false;
    for (const selector of nameSelectors) {
      const nameEl = item.querySelector(selector);
      if (nameEl && nameEl.textContent.trim()) {
        console.log(`  ✅ Name found with ${selector}: ${nameEl.textContent.trim()}`);
        foundName = true;
        break;
      }
    }
    
    if (!foundName) {
      console.log('  ❌ No name found with standard selectors');
      // Try to extract potential names from text
      const lines = item.textContent.split('\n').map(l => l.trim()).filter(l => l);
      console.log('  Text lines:', lines.slice(0, 3));
    }
  });
}

// Test 4: Look for active message thread
console.log('\n4️⃣ Testing message thread detection...');

const threadSelectors = [
  '.msg-s-message-list',
  '.message-thread',
  '[data-view-name="message-thread"]'
];

let messageThread = null;
for (const selector of threadSelectors) {
  messageThread = document.querySelector(selector);
  if (messageThread) {
    console.log(`✅ Found message thread with: ${selector}`);
    
    // Look for messages in the thread
    const messages = messageThread.querySelectorAll('.msg-s-event-listitem, .message-item');
    console.log(`  Found ${messages.length} messages in thread`);
    
    if (messages.length > 0) {
      console.log('  Sample message senders:');
      Array.from(messages).slice(0, 3).forEach((msg, i) => {
        const senderEl = msg.querySelector('.msg-s-message-group__name, .message-sender-name');
        if (senderEl) {
          console.log(`    Message ${i}: ${senderEl.textContent.trim()}`);
        }
      });
    }
    break;
  } else {
    console.log(`❌ No message thread with: ${selector}`);
  }
}

// Test 5: General DOM inspection
console.log('\n5️⃣ General DOM inspection...');

// Look for any elements that might contain conversation info
const potentialElements = document.querySelectorAll(
  '.msg-conversation-listitem, .conversation-item, [data-view-name*="conversation"], .msg-entity-lockup, [class*="conversation"]'
);

console.log(`Found ${potentialElements.length} potential conversation elements`);

if (potentialElements.length > 0) {
  console.log('Sample elements:');
  Array.from(potentialElements).slice(0, 3).forEach((el, i) => {
    console.log(`  [${i}]: ${el.className}`);
    console.log(`      Text: ${el.textContent.trim().substring(0, 80)}...`);
  });
}

// Test 6: Test the actual function if available
console.log('\n6️⃣ Testing extraction function...');

if (typeof extractLinkedInConversations === 'function') {
  try {
    console.log('Testing extractLinkedInConversations()...');
    const conversations = extractLinkedInConversations();
    console.log('✅ Conversations extracted:', conversations);
  } catch (error) {
    console.error('❌ extractLinkedInConversations failed:', error);
  }
} else {
  console.log('❌ extractLinkedInConversations function not available');
  console.log('💡 Try reloading the extension and refreshing the page');
}

console.log('\n🧪 Sidebar test completed!');

// Helper function to find all messaging-related elements
function findAllMessagingElements() {
  console.log('\n🔍 Finding all messaging-related elements...');
  
  const patterns = ['msg', 'messaging', 'conversation', 'chat'];
  const allElements = [];
  
  patterns.forEach(pattern => {
    const elements = document.querySelectorAll(`[class*="${pattern}"], [data-view-name*="${pattern}"], [id*="${pattern}"]`);
    console.log(`Elements with "${pattern}": ${elements.length}`);
    allElements.push(...elements);
  });
  
  // Remove duplicates
  const uniqueElements = [...new Set(allElements)];
  console.log(`Total unique messaging elements: ${uniqueElements.length}`);
  
  return uniqueElements;
}

// Run the helper function
findAllMessagingElements();
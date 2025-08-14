// Test message history extraction
console.log('🧪 Testing Message History Extraction...');

// Test 1: Look for message containers
console.log('\n1️⃣ Looking for message containers...');

const containerSelectors = [
  '.msg-s-message-list-content',
  '.msg-s-message-list',
  '[data-view-name="message-thread"]',
  '.msg-overlay-conversation-bubble .msg-s-message-list-content',
  '.msg-overlay-conversation-bubble .msg-s-message-list',
  '[class*="message-list"]',
  '[class*="msg-s-message"]'
];

let messageContainer = null;
for (const selector of containerSelectors) {
  messageContainer = document.querySelector(selector);
  if (messageContainer) {
    console.log(`✅ Found message container: ${selector}`);
    break;
  } else {
    console.log(`❌ No container with: ${selector}`);
  }
}

if (messageContainer) {
  // Test 2: Look for message elements
  console.log('\n2️⃣ Looking for message elements...');
  
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
      console.log(`✅ Found ${messageElements.length} messages with: ${selector}`);
      break;
    } else {
      console.log(`❌ No messages with: ${selector}`);
    }
  }
  
  if (messageElements.length > 0) {
    // Test 3: Extract content from first few messages
    console.log('\n3️⃣ Extracting message content...');
    
    Array.from(messageElements).slice(0, 5).forEach((msgEl, i) => {
      console.log(`\nMessage ${i}:`);
      
      // Try to find sender
      const senderSelectors = [
        '.msg-s-message-group__name',
        '.msg-s-message-group__profile-link',
        '.message-sender-name',
        '.sender-name'
      ];
      
      let sender = 'Unknown';
      for (const selector of senderSelectors) {
        const senderEl = msgEl.querySelector(selector);
        if (senderEl && senderEl.textContent.trim()) {
          sender = senderEl.textContent.trim();
          break;
        }
      }
      
      // Try to find content
      const contentSelectors = [
        '.msg-s-event-listitem__body',
        '.msg-s-message-group__message',
        '.message-content',
        '.message-body'
      ];
      
      let content = '';
      for (const selector of contentSelectors) {
        const contentEl = msgEl.querySelector(selector);
        if (contentEl && contentEl.textContent.trim()) {
          content = contentEl.textContent.trim();
          break;
        }
      }
      
      console.log(`  Sender: ${sender}`);
      console.log(`  Content: ${content.substring(0, 100)}...`);
      console.log(`  Full text: ${msgEl.textContent.trim().substring(0, 150)}...`);
    });
    
    // Test 4: Test the actual function
    console.log('\n4️⃣ Testing getConversationHistory function...');
    
    if (typeof getConversationHistory === 'function') {
      try {
        const history = getConversationHistory(0);
        console.log(`✅ Function returned ${history.length} messages`);
        
        if (history.length > 0) {
          console.log('Sample extracted messages:');
          history.slice(0, 3).forEach((msg, i) => {
            console.log(`  ${i}: ${msg.sender} - ${msg.content.substring(0, 80)}...`);
          });
        }
      } catch (error) {
        console.error('❌ Function error:', error);
      }
    } else {
      console.log('❌ getConversationHistory function not available');
    }
  }
} else {
  console.log('\n❌ No message container found');
  
  // Debug: Show all message-related elements
  console.log('\n🔍 All message-related elements:');
  const allMsgElements = document.querySelectorAll('[class*="msg"], [class*="message"]');
  console.log(`Found ${allMsgElements.length} total message-related elements`);
  
  // Show first 10
  Array.from(allMsgElements).slice(0, 10).forEach((el, i) => {
    console.log(`  ${i}: ${el.tagName}.${el.className}`);
  });
}

console.log('\n🧪 Message history test completed!');
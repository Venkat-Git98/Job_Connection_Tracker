// Test script for LinkedIn message extraction
// Run this in the browser console on your LinkedIn messaging page

console.log('🧪 Testing LinkedIn Message Extraction...');

// Test 1: Check if we can find the messaging popup
console.log('\n1️⃣ Testing messaging popup detection...');
const messagingPopup = document.querySelector('.msg-overlay-conversation-bubble-header');
console.log('Messaging popup found:', !!messagingPopup);

if (messagingPopup) {
  // Test 2: Extract person name from header
  console.log('\n2️⃣ Testing person name extraction...');
  const headerTitle = messagingPopup.querySelector('.msg-overlay-bubble-header__title');
  console.log('Header title found:', !!headerTitle);
  
  if (headerTitle) {
    const personNameLink = headerTitle.querySelector('a .hoverable-link-text');
    console.log('Person name link found:', !!personNameLink);
    
    if (personNameLink) {
      const personName = personNameLink.textContent.trim();
      console.log('✅ Person name:', personName);
    }
  }
  
  // Test 3: Check message list
  console.log('\n3️⃣ Testing message list detection...');
  const messageList = document.querySelector('.msg-s-message-list-content');
  console.log('Message list found:', !!messageList);
  
  if (messageList) {
    const messageEvents = messageList.querySelectorAll('.msg-s-message-list__event');
    console.log(`Found ${messageEvents.length} message events`);
    
    // Test 4: Extract first few messages
    console.log('\n4️⃣ Testing message extraction...');
    let messageCount = 0;
    
    Array.from(messageEvents).slice(0, 5).forEach((eventEl, index) => {
      // Skip time headers
      if (eventEl.querySelector('.msg-s-message-list__time-heading')) {
        console.log(`Event ${index}: Time header - skipping`);
        return;
      }
      
      const messageItem = eventEl.querySelector('.msg-s-event-listitem');
      if (!messageItem) {
        console.log(`Event ${index}: No message item found`);
        return;
      }
      
      const senderNameEl = messageItem.querySelector('.msg-s-message-group__name');
      const contentEl = messageItem.querySelector('.msg-s-event-listitem__body');
      
      if (senderNameEl && contentEl) {
        const senderName = senderNameEl.textContent.trim();
        const content = contentEl.textContent.trim().substring(0, 100);
        
        console.log(`Message ${messageCount}:`);
        console.log(`  Sender: ${senderName}`);
        console.log(`  Content: ${content}...`);
        console.log(`  Is sent by you: ${senderName.includes('Venkatesh S')}`);
        
        messageCount++;
      }
    });
    
    console.log(`\n✅ Successfully extracted ${messageCount} messages`);
  }
}

// Test 5: Test the actual extraction functions if available
console.log('\n5️⃣ Testing extraction functions...');

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
}

if (typeof getConversationHistory === 'function') {
  try {
    console.log('Testing getConversationHistory()...');
    const history = getConversationHistory(0);
    console.log('✅ History extracted:', history.length, 'messages');
    if (history.length > 0) {
      console.log('Sample message:', history[0]);
    }
  } catch (error) {
    console.error('❌ getConversationHistory failed:', error);
  }
} else {
  console.log('❌ getConversationHistory function not available');
}

console.log('\n🧪 Test completed!');

// Helper function to inspect the DOM structure
function inspectDOM() {
  console.log('\n🔍 DOM Structure Inspection:');
  
  const selectors = [
    '.msg-overlay-conversation-bubble-header',
    '.msg-overlay-bubble-header__title',
    '.msg-s-message-list-content',
    '.msg-s-message-list__event',
    '.msg-s-event-listitem',
    '.msg-s-message-group__name',
    '.msg-s-event-listitem__body'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements`);
    
    if (elements.length > 0 && elements.length < 5) {
      elements.forEach((el, i) => {
        const text = el.textContent?.trim().substring(0, 50) || '[no text]';
        console.log(`  [${i}]: ${text}...`);
      });
    }
  });
}

// Run DOM inspection
inspectDOM();
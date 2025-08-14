// Simple test for LinkedIn messaging extraction
console.log('🧪 Simple LinkedIn Test...');

// Test 1: Find the messaging sidebar
const sidebar = document.querySelector('.msg-overlay-list-bubble');
console.log('Sidebar found:', !!sidebar);

if (sidebar) {
  // Test 2: Find conversation items
  const conversations = sidebar.querySelectorAll('.msg-conversation-listitem__link');
  console.log(`Found ${conversations.length} conversations`);
  
  // Test 3: Extract names from first few conversations
  Array.from(conversations).slice(0, 3).forEach((conv, i) => {
    const nameEl = conv.querySelector('.msg-conversation-listitem__participant-names') ||
                   conv.querySelector('.msg-conversation-card__participant-names') ||
                   conv.querySelector('h3');
    
    const messageEl = conv.querySelector('.msg-overlay-list-bubble__message-snippet--v2');
    
    console.log(`Conversation ${i}:`);
    console.log(`  Name: ${nameEl ? nameEl.textContent.trim() : 'Not found'}`);
    console.log(`  Message: ${messageEl ? messageEl.textContent.trim().substring(0, 50) : 'Not found'}...`);
  });
  
  // Test 4: Test the extraction function
  if (typeof extractLinkedInConversations === 'function') {
    try {
      const result = extractLinkedInConversations();
      console.log('✅ Function result:', result);
    } catch (error) {
      console.error('❌ Function error:', error);
    }
  } else {
    console.log('❌ Function not available - reload extension');
  }
} else {
  console.log('❌ No sidebar found');
}
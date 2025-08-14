// Popup script for LinkedIn Job Tracker extension

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const statusDiv = document.getElementById('status');
  const pageInfoDiv = document.getElementById('pageInfo');
  const pageTitleEl = document.getElementById('pageTitle');
  const pageTypeEl = document.getElementById('pageType');
  const pageUrlEl = document.getElementById('pageUrl');
  const extractBtn = document.getElementById('extractBtn');
  const extractMessagesBtn = document.getElementById('extractMessagesBtn');
  const generateConnectionBtn = document.getElementById('generateConnectionBtn');
  const markAppliedBtn = document.getElementById('markAppliedBtn');
  const messageSection = document.getElementById('messageSection');
  const messageInput = document.getElementById('messageInput');
  const rewriteBtn = document.getElementById('rewriteBtn');
  const generatedContent = document.getElementById('generatedContent');
  
  // Message Context Interface Elements
  const messageContextSection = document.getElementById('messageContextSection');
  const conversationList = document.getElementById('conversationList');
  const conversationItems = document.getElementById('conversationItems');
  const chatInterface = document.getElementById('chatInterface');
  const chatPersonName = document.getElementById('chatPersonName');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const conversationHistory = document.getElementById('conversationHistory');
  const draftMessageInput = document.getElementById('draftMessageInput');
  const generateMessageBtn = document.getElementById('generateMessageBtn');
  const rewriteDraftBtn = document.getElementById('rewriteDraftBtn');


  let currentPageData = null;
  let currentConversations = [];
  let selectedConversation = null;

  // Load last extraction data
  await loadLastExtraction();

  // Event listeners
  extractBtn.addEventListener('click', extractPageData);
  extractMessagesBtn.addEventListener('click', extractMessageContext);
  generateConnectionBtn.addEventListener('click', generateConnectionRequest);
  markAppliedBtn.addEventListener('click', markJobAsApplied);
  rewriteBtn.addEventListener('click', rewriteMessage);
  
  // Message Context Event Listeners
  closeChatBtn.addEventListener('click', closeChatInterface);
  generateMessageBtn.addEventListener('click', generateContextualMessage);
  rewriteDraftBtn.addEventListener('click', rewriteDraftMessage);

  async function loadLastExtraction() {
    try {
      const result = await chrome.storage.local.get(['lastExtraction', 'lastError']);
      
      if (result.lastError && (!result.lastExtraction || result.lastError.timestamp > result.lastExtraction.timestamp)) {
        showStatus('error', `Error: ${result.lastError.message}`);
        return;
      }

      if (result.lastExtraction) {
        const data = result.lastExtraction;
        currentPageData = data;
        
        // Show page info
        showPageInfo(data);
        
        // Show appropriate buttons based on page type
        if (data.classification === 'linkedin_profile') {
          generateConnectionBtn.classList.remove('hidden');
          messageSection.classList.remove('hidden');
        } else if (data.classification === 'job_application') {
          markAppliedBtn.classList.remove('hidden');
        }
        
        showStatus('success', 'Page data extracted successfully');
      } else {
        showStatus('info', 'Click "Extract Page Data" to analyze the current page');
      }
    } catch (error) {
      console.error('Error loading last extraction:', error);
      showStatus('error', 'Failed to load previous data');
    }
  }

  async function extractPageData() {
    try {
      setLoading(extractBtn, true);
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to background script to extract data
      const response = await chrome.runtime.sendMessage({
        action: 'extractPageData',
        tabId: tab.id,
        url: tab.url,
        title: tab.title
      });

      if (response && response.success) {
        currentPageData = response.data;
        showPageInfo(response.data);
        
        // Show appropriate buttons based on page type
        if (response.data.classification === 'linkedin_profile') {
          generateConnectionBtn.classList.remove('hidden');
          messageSection.classList.remove('hidden');
        } else if (response.data.classification === 'job_application') {
          markAppliedBtn.classList.remove('hidden');
        }
        
        showStatus('success', 'Page data extracted successfully');
      } else {
        throw new Error(response?.error || 'Failed to extract page data');
      }
      
    } catch (error) {
      console.error('Error extracting page data:', error);
      showStatus('error', `Failed to extract page data: ${error.message}`);
    } finally {
      setLoading(extractBtn, false);
    }
  }

  async function generateConnectionRequest() {
    if (!currentPageData || currentPageData.classification !== 'linkedin_profile') {
      showStatus('error', 'No LinkedIn profile data available');
      return;
    }

    try {
      setLoading(generateConnectionBtn, true);
      
      const response = await chrome.runtime.sendMessage({
        action: 'generateConnection',
        profileData: currentPageData.extractedData
      });

      if (response.error) {
        throw new Error(response.error);
      }

      showGeneratedContent('Connection Request', response.connectionRequest, 'connection');
      showStatus('success', 'Connection request generated successfully');
      
    } catch (error) {
      console.error('Error generating connection request:', error);
      showStatus('error', `Failed to generate connection request: ${error.message}`);
    } finally {
      setLoading(generateConnectionBtn, false);
    }
  }

  async function rewriteMessage() {
    const draftMessage = messageInput.value.trim();
    
    if (!draftMessage) {
      showStatus('error', 'Please enter a message to rewrite');
      return;
    }

    try {
      setLoading(rewriteBtn, true);
      
      // Try to get conversation context from current page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      let conversationContext = null;
      
      try {
        const contextResponse = await chrome.tabs.sendMessage(tab.id, {
          action: 'getConversationContext'
        });
        conversationContext = contextResponse?.context;
      } catch (e) {
        console.log('Could not get conversation context:', e);
      }

      const response = await chrome.runtime.sendMessage({
        action: 'rewriteMessage',
        data: {
          draftMessage,
          conversationContext,
          targetProfile: currentPageData?.extractedData
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      showGeneratedContent('Rewritten Messages', response.options, 'messages');
      showStatus('success', 'Message rewritten successfully');
      
    } catch (error) {
      console.error('Error rewriting message:', error);
      showStatus('error', `Failed to rewrite message: ${error.message}`);
    } finally {
      setLoading(rewriteBtn, false);
    }
  }

  async function markJobAsApplied() {
    if (!currentPageData || currentPageData.classification !== 'job_application') {
      showStatus('error', 'No job data available');
      return;
    }

    try {
      setLoading(markAppliedBtn, true);
      
      const response = await chrome.runtime.sendMessage({
        action: 'markJobApplied',
        jobUrl: currentPageData.url
      });

      if (response.error) {
        throw new Error(response.error);
      }

      showStatus('success', 'Job marked as applied successfully');
      markAppliedBtn.textContent = 'Marked as Applied ✓';
      markAppliedBtn.disabled = true;
      
    } catch (error) {
      console.error('Error marking job as applied:', error);
      showStatus('error', `Failed to mark job as applied: ${error.message}`);
    } finally {
      setLoading(markAppliedBtn, false);
    }
  }

  async function extractMessageContext() {
    try {
      setLoading(extractMessagesBtn, true);
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on LinkedIn messaging
      if (!tab.url.includes('linkedin.com')) {
        showStatus('error', 'Please navigate to LinkedIn messaging to extract conversations');
        return;
      }
      
      // Send message to content script to extract conversations
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractLinkedInConversations'
      });

      if (response && response.conversations && response.conversations.length > 0) {
        currentConversations = response.conversations;
        showConversationList(response.conversations);
        messageContextSection.classList.remove('hidden');
        showStatus('success', `Found ${response.conversations.length} active conversations`);
      } else {
        showStatus('info', 'No active conversations found. Please open LinkedIn messaging and try again.');
      }
      
    } catch (error) {
      console.error('Error extracting message context:', error);
      showStatus('error', `Failed to extract conversations: ${error.message}`);
    } finally {
      setLoading(extractMessagesBtn, false);
    }
  }

  function showConversationList(conversations) {
    conversationItems.innerHTML = '';
    
    conversations.forEach((conversation, index) => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.innerHTML = `
        <div class="person-name">${conversation.personName}</div>
        <div class="last-message">${conversation.lastMessage || 'No recent messages'}</div>
      `;
      
      item.addEventListener('click', () => openChatInterface(conversation, index));
      conversationItems.appendChild(item);
    });
    
    conversationList.classList.remove('hidden');
  }

  async function openChatInterface(conversation, index) {
    selectedConversation = conversation;
    chatPersonName.textContent = `Chat with ${conversation.personName}`;
    
    // Hide conversation list and show chat interface
    conversationList.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    
    // Load conversation history
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getConversationHistory',
        conversationIndex: index
      });

      if (response && response.messages) {
        displayConversationHistory(response.messages);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      conversationHistory.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">Could not load conversation history</div>';
    }
  }

  function displayConversationHistory(messages) {
    conversationHistory.innerHTML = '';
    
    messages.forEach(message => {
      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${message.isSent ? 'sent' : 'received'}`;
      bubble.textContent = message.content;
      conversationHistory.appendChild(bubble);
    });
    
    // Scroll to bottom
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
  }

  function closeChatInterface() {
    chatInterface.classList.add('hidden');
    conversationList.classList.remove('hidden');
    selectedConversation = null;
    draftMessageInput.value = '';
  }

  async function generateContextualMessage() {
    if (!selectedConversation) {
      showStatus('error', 'No conversation selected');
      return;
    }

    try {
      setLoading(generateMessageBtn, true);
      
      // Get conversation history for context
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const historyResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'getConversationHistory',
        conversationIndex: currentConversations.indexOf(selectedConversation)
      });

      const response = await chrome.runtime.sendMessage({
        action: 'generateContextualMessage',
        data: {
          personName: selectedConversation.personName,
          conversationHistory: historyResponse?.messages || [],
          context: 'professional_networking'
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Show generated message in the draft input
      draftMessageInput.value = response.message;
      showStatus('success', 'Contextual message generated successfully');
      
    } catch (error) {
      console.error('Error generating contextual message:', error);
      showStatus('error', `Failed to generate message: ${error.message}`);
    } finally {
      setLoading(generateMessageBtn, false);
    }
  }

  async function rewriteDraftMessage() {
    const draftMessage = draftMessageInput.value.trim();
    
    if (!draftMessage) {
      showStatus('error', 'Please enter a message to rewrite');
      return;
    }

    if (!selectedConversation) {
      showStatus('error', 'No conversation selected');
      return;
    }

    try {
      setLoading(rewriteDraftBtn, true);
      
      // Get conversation history for context
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const historyResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'getConversationHistory',
        conversationIndex: currentConversations.indexOf(selectedConversation)
      });

      const response = await chrome.runtime.sendMessage({
        action: 'rewriteMessage',
        data: {
          draftMessage,
          conversationContext: historyResponse?.messages || [],
          targetProfile: { personName: selectedConversation.personName }
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Show rewritten options
      showGeneratedContent('Rewritten Message Options', response.options, 'messages');
      showStatus('success', 'Message rewritten successfully');
      
    } catch (error) {
      console.error('Error rewriting message:', error);
      showStatus('error', `Failed to rewrite message: ${error.message}`);
    } finally {
      setLoading(rewriteDraftBtn, false);
    }
  }

  function showStatus(type, message) {
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
  }

  function showPageInfo(data) {
    pageTitleEl.textContent = data.pageTitle || 'Unknown Page';
    
    // Style the page type badge
    const typeText = data.classification === 'linkedin_profile' ? '👤 LinkedIn Profile' : 
                    data.classification === 'job_application' ? '💼 Job Posting' : 
                    '❓ Unknown Page';
    pageTypeEl.textContent = typeText;
    
    pageUrlEl.textContent = data.url;
    pageInfoDiv.classList.remove('hidden');
  }

  function showGeneratedContent(title, content, type) {
    // Clear previous content
    generatedContent.innerHTML = '';
    
    if (type === 'connection') {
      const contentDiv = document.createElement('div');
      contentDiv.className = 'generated-content';
      
      const headerDiv = document.createElement('div');
      headerDiv.className = 'content-header';
      headerDiv.innerHTML = `✨ ${title}`;
      
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = 'margin-bottom: 12px; color: #4a5568; line-height: 1.6;';
      messageDiv.textContent = content;
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '📋 Copy to Clipboard';
      copyBtn.addEventListener('click', () => copyToClipboard(content, copyBtn));
      
      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(messageDiv);
      contentDiv.appendChild(copyBtn);
      generatedContent.appendChild(contentDiv);
      
    } else if (type === 'messages' && Array.isArray(content)) {
      content.forEach((option, index) => {
        const optionTitle = option.type || `Option ${index + 1}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'generated-content';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'content-header';
        headerDiv.innerHTML = `💬 ${optionTitle}`;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'margin-bottom: 12px; color: #4a5568; line-height: 1.6;';
        messageDiv.textContent = option.message;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 Copy to Clipboard';
        copyBtn.addEventListener('click', () => copyToClipboard(option.message, copyBtn));
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(messageDiv);
        contentDiv.appendChild(copyBtn);
        generatedContent.appendChild(contentDiv);
      });
    }
    
    generatedContent.classList.remove('hidden');
  }

  function setLoading(button, loading) {
    if (loading) {
      button.innerHTML = '<span class="loading"></span>' + button.textContent;
      button.disabled = true;
    } else {
      button.innerHTML = button.textContent.replace(/^.*?([A-Z])/, '$1');
      button.disabled = false;
    }
  }

  // Copy to clipboard function with improved feedback
  async function copyToClipboard(text, buttonElement) {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Copy command failed');
        }
      }
      
      // Visual feedback on button
      if (buttonElement) {
        const originalText = buttonElement.textContent;
        buttonElement.classList.add('copied');
        buttonElement.textContent = '📋 Copied!';
        
        setTimeout(() => {
          buttonElement.classList.remove('copied');
          buttonElement.textContent = originalText;
        }, 2000);
      }
      
      showStatus('success', 'Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showStatus('error', 'Failed to copy to clipboard. Please select and copy manually.');
      
      // Show the text in a modal or alert as fallback
      const fallbackDiv = document.createElement('div');
      fallbackDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        max-width: 90%;
        word-wrap: break-word;
      `;
      fallbackDiv.innerHTML = `
        <h4>Copy this text manually:</h4>
        <textarea readonly style="width: 100%; height: 100px; margin: 10px 0;">${text}</textarea>
        <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      `;
      document.body.appendChild(fallbackDiv);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (fallbackDiv.parentElement) {
          fallbackDiv.remove();
        }
      }, 10000);
    }
  }
});
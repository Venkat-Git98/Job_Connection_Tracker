// Popup script for LinkedIn Job Tracker extension

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const statusDiv = document.getElementById('status');
  const pageInfoDiv = document.getElementById('pageInfo');
  const pageTitleEl = document.getElementById('pageTitle');
  const pageTypeEl = document.getElementById('pageType');
  const pageUrlEl = document.getElementById('pageUrl');
  const extractBtn = document.getElementById('extractBtn');
  const generateConnectionBtn = document.getElementById('generateConnectionBtn');
  const markAppliedBtn = document.getElementById('markAppliedBtn');
  const messageSection = document.getElementById('messageSection');
  const messageInput = document.getElementById('messageInput');
  const rewriteBtn = document.getElementById('rewriteBtn');
  const generatedContent = document.getElementById('generatedContent');

  let currentPageData = null;

  // Load last extraction data
  await loadLastExtraction();

  // Event listeners
  extractBtn.addEventListener('click', extractPageData);
  generateConnectionBtn.addEventListener('click', generateConnectionRequest);
  markAppliedBtn.addEventListener('click', markJobAsApplied);
  rewriteBtn.addEventListener('click', rewriteMessage);

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
    let html = '';
    
    if (type === 'connection') {
      html += `
        <div class="generated-content">
          <div class="content-header">✨ ${title}</div>
          <div style="margin-bottom: 12px; color: #4a5568; line-height: 1.6;">${content}</div>
          <button class="copy-btn" onclick="copyToClipboard('${content.replace(/'/g, "\\'")}')">
            📋 Copy to Clipboard
          </button>
        </div>
      `;
    } else if (type === 'messages' && Array.isArray(content)) {
      content.forEach((option, index) => {
        const optionTitle = option.type || `Option ${index + 1}`;
        html += `
          <div class="generated-content">
            <div class="content-header">💬 ${optionTitle}</div>
            <div style="margin-bottom: 12px; color: #4a5568; line-height: 1.6;">${option.message}</div>
            <button class="copy-btn" onclick="copyToClipboard('${option.message.replace(/'/g, "\\'")}')">
              📋 Copy to Clipboard
            </button>
          </div>
        `;
      });
    }
    
    generatedContent.innerHTML = html;
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

  // Make copyToClipboard available globally
  window.copyToClipboard = async function(text) {
    try {
      await navigator.clipboard.writeText(text);
      showStatus('success', 'Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showStatus('error', 'Failed to copy to clipboard');
    }
  };
});
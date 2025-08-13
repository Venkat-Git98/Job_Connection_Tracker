// Background service worker for LinkedIn Job Tracker extension

const API_BASE_URL = 'http://localhost:3001/api';

// Handle page data extraction
async function extractPageData(tabId, url, title) {
  try {
    // Inject content script if not already present
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    // Send message to content script to extract data
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'extractPageData',
      url: url,
      title: title
    });

    if (response && response.success) {
      // Send extracted data to backend
      await sendToBackend(response.data);
      
      // Store last extraction result for popup
      await chrome.storage.local.set({
        lastExtraction: {
          ...response.data,
          timestamp: Date.now(),
          tabId: tabId
        }
      });

      return { success: true, data: response.data };
    } else {
      throw new Error('Content script failed to extract data');
    }
  } catch (error) {
    console.error('Background script error:', error);
    await chrome.storage.local.set({
      lastError: {
        message: error.message,
        timestamp: Date.now()
      }
    });
    return { success: false, error: error.message };
  }
}

// Send data to backend API
async function sendToBackend(extractionData) {
  try {
    console.log('Sending data to backend:', extractionData);
    
    const response = await fetch(`${API_BASE_URL}/ingest/page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send data to backend');
    }

    console.log('✅ Data sent to backend successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send data to backend:', error);
    throw error;
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPageData') {
    extractPageData(request.tabId, request.url, request.title)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'generateConnection') {
    generateConnectionRequest(request.profileData)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'rewriteMessage') {
    rewriteMessage(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'markJobApplied') {
    markJobAsApplied(request.jobUrl)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Generate connection request using AI
async function generateConnectionRequest(profileData) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetProfile: profileData })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate connection request');
    }

    return result;
  } catch (error) {
    console.error('Failed to generate connection request:', error);
    throw error;
  }
}

// Rewrite message using AI
async function rewriteMessage(messageData) {
  try {
    const response = await fetch(`${API_BASE_URL}/rewrite/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to rewrite message');
    }

    return result;
  } catch (error) {
    console.error('Failed to rewrite message:', error);
    throw error;
  }
}

// Mark job as applied
async function markJobAsApplied(jobUrl) {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/mark-applied`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobUrl })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to mark job as applied');
    }

    return result;
  } catch (error) {
    console.error('Failed to mark job as applied:', error);
    throw error;
  }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Job Tracker extension installed');
});
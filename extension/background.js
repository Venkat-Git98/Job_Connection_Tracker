// Background service worker for LinkedIn Job Tracker extension

const API_BASE_URL = 'https://jobconnectiontracker-production.up.railway.app/api';

// Global error handler
self.addEventListener('error', (event) => {
  console.warn('Background script error:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.warn('Background script unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Utility function for making API calls with better error handling
async function makeAPICall(endpoint, options = {}) {
  try {
    // Get current user ID from storage
    const result = await chrome.storage.local.get(['currentUserId']);
    const userId = result.currentUserId;

    if (!userId) {
      throw new Error('No user selected. Please select a user profile first.');
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId.toString()
      },
      signal: controller.signal
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

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

    const apiResult = await makeAPICall('/ingest/page', {
      method: 'POST',
      body: JSON.stringify(extractionData)
    });

    console.log('✅ Data sent to backend successfully:', apiResult);
    return apiResult;
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

  if (request.action === 'generateContextualMessage') {
    generateContextualMessage(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Generate connection request using AI
async function generateConnectionRequest(profileData) {
  try {
    // Get current user ID from storage
    const result = await chrome.storage.local.get(['currentUserId']);
    const userId = result.currentUserId;

    if (!userId) {
      throw new Error('No user selected. Please select a user profile first.');
    }

    const response = await fetch(`${API_BASE_URL}/generate/connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId.toString()
      },
      body: JSON.stringify({ targetProfile: profileData })
    });

    const apiResult = await response.json();

    if (!response.ok) {
      throw new Error(apiResult.error || 'Failed to generate connection request');
    }

    return apiResult;
  } catch (error) {
    console.error('Failed to generate connection request:', error);
    throw error;
  }
}

// Rewrite message using AI
async function rewriteMessage(messageData) {
  try {
    // Get current user ID from storage
    const result = await chrome.storage.local.get(['currentUserId']);
    const userId = result.currentUserId;

    if (!userId) {
      throw new Error('No user selected. Please select a user profile first.');
    }

    const response = await fetch(`${API_BASE_URL}/rewrite/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId.toString()
      },
      body: JSON.stringify(messageData)
    });

    const apiResult = await response.json();

    if (!response.ok) {
      throw new Error(apiResult.error || 'Failed to rewrite message');
    }

    return apiResult;
  } catch (error) {
    console.error('Failed to rewrite message:', error);
    throw error;
  }
}

// Mark job as applied
async function markJobAsApplied(jobUrl) {
  try {
    // Get current user ID from storage
    const result = await chrome.storage.local.get(['currentUserId']);
    const userId = result.currentUserId;

    if (!userId) {
      throw new Error('No user selected. Please select a user profile first.');
    }

    const response = await fetch(`${API_BASE_URL}/jobs/mark-applied`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId.toString()
      },
      body: JSON.stringify({ jobUrl })
    });

    const apiResult = await response.json();

    if (!response.ok) {
      throw new Error(apiResult.error || 'Failed to mark job as applied');
    }

    return apiResult;
  } catch (error) {
    console.error('Failed to mark job as applied:', error);
    throw error;
  }
}

// Generate contextual message using AI
async function generateContextualMessage(messageData) {
  try {
    // Get current user ID from storage
    const result = await chrome.storage.local.get(['currentUserId']);
    const userId = result.currentUserId;

    if (!userId) {
      throw new Error('No user selected. Please select a user profile first.');
    }

    const response = await fetch(`${API_BASE_URL}/rewrite/contextual-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId.toString()
      },
      body: JSON.stringify(messageData)
    });

    const apiResult = await response.json();

    if (!response.ok) {
      throw new Error(apiResult.error || 'Failed to generate contextual message');
    }

    return apiResult;
  } catch (error) {
    console.error('Failed to generate contextual message:', error);
    throw error;
  }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Job Tracker extension installed');
});
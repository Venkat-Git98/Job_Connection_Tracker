// User Management System for Chrome Extension

class UserManager {
  constructor() {
    this.API_BASE_URL = 'https://jobconnectiontracker-production.up.railway.app/api';
    this.currentUser = null;
    this.users = [];
  }

  // Initialize user manager
  async initialize() {
    try {
      await this.loadCurrentUser();
      await this.loadAllUsers();
      return true;
    } catch (error) {
      console.error('Failed to initialize user manager:', error);
      return false;
    }
  }

  // Load current user from storage
  async loadCurrentUser() {
    try {
      const result = await chrome.storage.local.get(['currentUserId']);
      if (result.currentUserId) {
        const user = await this.getUserById(result.currentUserId);
        if (user) {
          this.currentUser = user;
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load current user:', error);
      return null;
    }
  }

  // Load all users from API
  async loadAllUsers() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users`);
      const result = await response.json();
      
      if (result.success) {
        this.users = result.users;
        return this.users;
      } else {
        throw new Error(result.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      this.users = [];
      return [];
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        return result.user;
      } else {
        throw new Error(result.message || 'User not found');
      }
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  // Create new user
  async createUser(username, displayName) {
    try {
      // Validate input
      if (!username || username.length < 2) {
        throw new Error('Username must be at least 2 characters long');
      }
      
      if (!displayName || displayName.length < 1) {
        throw new Error('Display name is required');
      }

      // Clean username (alphanumeric only)
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanUsername.length < 2) {
        throw new Error('Username must contain at least 2 alphanumeric characters');
      }

      const response = await fetch(`${this.API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUsername,
          displayName: displayName.trim(),
          preferences: {
            theme: 'dark',
            notifications: true,
            ai_personality: {}
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Add to local users list
        this.users.push(result.user);
        
        // Set as current user
        await this.setCurrentUser(result.user.id);
        
        return result.user;
      } else {
        throw new Error(result.message || result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  // Set current user
  async setCurrentUser(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Find user in local list or fetch from API
      let user = this.users.find(u => u.id === userId);
      if (!user) {
        user = await this.getUserById(userId);
        if (!user) {
          throw new Error('User not found');
        }
      }

      // Store in chrome storage
      await chrome.storage.local.set({ currentUserId: userId });
      
      // Update current user
      this.currentUser = user;
      
      // Update user activity
      await this.updateUserActivity(userId);
      
      return user;
    } catch (error) {
      console.error('Failed to set current user:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get all users
  getAllUsers() {
    return this.users;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Update user activity
  async updateUserActivity(userId) {
    try {
      await fetch(`${this.API_BASE_URL}/users/${userId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.warn('Failed to update user activity:', error);
      // Don't throw error as this is not critical
    }
  }

  // Clear current user (logout)
  async clearCurrentUser() {
    try {
      await chrome.storage.local.remove(['currentUserId']);
      this.currentUser = null;
    } catch (error) {
      console.error('Failed to clear current user:', error);
    }
  }

  // Get user context for API requests
  getUserContext() {
    if (!this.currentUser) {
      return null;
    }
    
    return {
      userId: this.currentUser.id,
      username: this.currentUser.username,
      displayName: this.currentUser.displayName
    };
  }

  // Add user ID header to API requests
  addUserHeaders(headers = {}) {
    if (this.currentUser) {
      headers['X-User-ID'] = this.currentUser.id.toString();
    }
    return headers;
  }

  // Validate username format
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }
    
    if (username.length < 2) {
      return { valid: false, error: 'Username must be at least 2 characters long' };
    }
    
    if (username.length > 50) {
      return { valid: false, error: 'Username cannot exceed 50 characters' };
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters and numbers' };
    }
    
    return { valid: true };
  }

  // Validate display name format
  validateDisplayName(displayName) {
    if (!displayName || typeof displayName !== 'string') {
      return { valid: false, error: 'Display name is required' };
    }
    
    if (displayName.trim().length < 1) {
      return { valid: false, error: 'Display name cannot be empty' };
    }
    
    if (displayName.length > 255) {
      return { valid: false, error: 'Display name cannot exceed 255 characters' };
    }
    
    return { valid: true };
  }

  // Check if username is available
  async isUsernameAvailable(username) {
    try {
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const existingUser = this.users.find(u => u.username === cleanUsername);
      return !existingUser;
    } catch (error) {
      console.error('Failed to check username availability:', error);
      return false;
    }
  }

  // Get user statistics
  async getUserStats(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const user = await this.getUserById(targetUserId);
      return user?.stats || { profiles: 0, jobs: 0, outreach: 0 };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return { profiles: 0, jobs: 0, outreach: 0 };
    }
  }

  // Handle user switching
  async switchUser(userId) {
    try {
      if (this.currentUser && this.currentUser.id === userId) {
        return this.currentUser; // Already selected
      }

      const user = await this.setCurrentUser(userId);
      
      // Notify other parts of the extension about user change
      chrome.runtime.sendMessage({
        action: 'userChanged',
        user: user
      }).catch(() => {
        // Ignore errors if no listeners
      });

      return user;
    } catch (error) {
      console.error('Failed to switch user:', error);
      throw error;
    }
  }

  // Export user data (for backup/migration)
  async exportUserData(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      // This would need to be implemented on the backend
      // For now, just return user info
      const user = await this.getUserById(targetUserId);
      return {
        user: user,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }
}

// Create global instance
window.userManager = new UserManager();
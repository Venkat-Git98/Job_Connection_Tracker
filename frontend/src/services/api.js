import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add user context to requests (except for user management endpoints)
    const isUserEndpoint = config.url?.startsWith('/users');
    const isHealthCheck = config.url?.includes('/health');
    
    if (!isUserEndpoint && !isHealthCheck) {
      const currentUserId = localStorage.getItem('currentUserId');
      if (currentUserId) {
        config.headers['X-User-ID'] = currentUserId;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Generic HTTP methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // User Management
  getUsers: () => api.get('/users'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  updateUserActivity: (userId) => api.post(`/users/${userId}/activity`),
  // Connections
  getConnections: (params = {}) => api.get('/connections', { params }),
  updateConnectionStatus: (profileId, status) => 
    api.post('/connections/update-status', { profileId, status }),
  addConnectionNote: (profileId, note) => 
    api.post('/connections/add-note', { profileId, note }),
  getConnectionStats: () => api.get('/connections/stats'),

  // Jobs
  getJobs: (params = {}) => api.get('/jobs', { params }),
  markJobAsApplied: (jobUrl) => api.post('/jobs/mark-applied', { jobUrl }),
  updateJobStatus: (jobUrl, status) => 
    api.post('/jobs/update-status', { jobUrl, status }),
  addJobNote: (jobUrl, note) => api.post('/jobs/add-note', { jobUrl, note }),

  // Outreach
  getOutreach: () => api.get('/outreach'),
  getOutreachSummary: () => api.get('/outreach/summary'),
  addCompany: (companyName) => api.post('/outreach/add-company', { companyName }),
  getCompanyProfiles: (companyName) => api.get(`/outreach/company/${encodeURIComponent(companyName)}`),

  // Generation
  generateConnection: (targetProfile) => 
    api.post('/generate/connection', { targetProfile }),
  rewriteMessage: (data) => api.post('/rewrite/message', data),
  getPersonalProfile: () => api.get('/generate/profile'),
  updatePersonalProfile: (profileData) => 
    api.post('/generate/profile', { profileData }),

  // Email monitoring
  getEmailEvents: (params = {}) => api.get('/email/events', { params }),
  getEmailMonitoringStatus: () => api.get('/email/status'),
  checkEmailsNow: () => api.post('/email/check-now'),
  startEmailMonitoring: (intervalMinutes = 60) => 
    api.post('/email/start-monitoring', { intervalMinutes }),
  stopEmailMonitoring: () => api.post('/email/stop-monitoring'),
  getEmailClassificationStats: () => api.get('/email/classification-stats'),
  submitEmailClassificationFeedback: (data) => api.post('/email/classification-feedback', data),
  deleteEmailEvent: (eventId) => api.delete(`/email/events/${eventId}`),
  bulkDeleteEmailEvents: (eventIds) => api.delete('/email/events', { data: { eventIds } }),

  // Companies
  getCompanies: (params = {}) => api.get('/outreach/summary', { params }),
  getCompanyDetails: (companyName) => api.get(`/outreach/company/${encodeURIComponent(companyName)}`),

  // Analytics
  getDashboardAnalytics: (timeRange = '30d') => 
    api.get('/analytics/dashboard', { params: { timeRange } }),
  getPerformanceMetrics: () => api.get('/analytics/performance'),
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getRecentActivity: () => api.get('/analytics/dashboard'),
  getAnalytics: (params = {}) => api.get('/analytics/dashboard', { params }),

  // Health check
  healthCheck: () => api.get('/health', { baseURL: API_BASE_URL.replace('/api', '') }),
};

export default api;
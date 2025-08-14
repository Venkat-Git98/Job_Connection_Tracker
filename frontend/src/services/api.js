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
  startEmailMonitoring: (intervalMinutes = 5) => 
    api.post('/email/start-monitoring', { intervalMinutes }),

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
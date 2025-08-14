require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration (allows extra origins from CORS_ORIGINS env var, comma-separated)
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost:5173'
];
const extraCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedCorsOrigins = [...defaultCorsOrigins, ...extraCorsOrigins];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedCorsOrigins.includes(origin);
    return callback(null, isAllowed);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

console.log('CORS allowed origins:', allowedCorsOrigins);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', require('./routes/api'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Start email monitoring if credentials are available
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    const emailScheduler = require('./services/emailScheduler');
    // Start monitoring every 5 minutes
    emailScheduler.start('*/5 * * * *');
    console.log('📧 Gmail monitoring started');
  } else {
    console.log('⚠️  Gmail credentials not found. Email monitoring disabled.');
    console.log('   Set GMAIL_EMAIL and GMAIL_APP_PASSWORD to enable email monitoring.');
  }
});
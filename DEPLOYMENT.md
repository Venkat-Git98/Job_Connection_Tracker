# Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **GitHub Repository**: Push your code to GitHub

## Backend Deployment (Railway)

### Option 1: Deploy from GitHub (Recommended)

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose the `backend` folder as the root directory

2. **Configure Environment Variables**:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=postgresql://... (Railway will provide this)
   NODE_ENV=production
   ```

3. **Database Setup**:
   - Railway will automatically provision a PostgreSQL database
   - The `DATABASE_URL` will be automatically set
   - Run migrations after deployment:
     ```bash
     railway run npm run migrate
     ```

### Option 2: Deploy with Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**:
   ```bash
   railway variables set GEMINI_API_KEY=your_key_here
   ```

## Frontend Deployment (Netlify)

### Option 1: Deploy from GitHub (Recommended)

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Set build settings:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend/dist`

2. **Configure Environment Variables**:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_BASE_URL=https://your-railway-app.railway.app/api`

### Option 2: Manual Deploy

1. **Build the Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `dist` folder to Netlify
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=dist
     ```

## Chrome Extension Setup

1. **Update API URL**:
   - Edit `extension/background.js`
   - Change `API_BASE_URL` to your Railway backend URL:
     ```javascript
     const API_BASE_URL = 'https://your-railway-app.railway.app/api';
     ```

2. **Load Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

## Post-Deployment Setup

1. **Test the Backend**:
   - Visit `https://your-railway-app.railway.app/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test the Frontend**:
   - Visit your Netlify URL
   - All three tabs should load without errors

3. **Test the Extension**:
   - Visit a LinkedIn profile
   - Click the extension icon
   - Check that data is being sent to your backend

## Environment Variables Reference

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
PORT=3001
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-railway-app.railway.app/api
```

## Troubleshooting

### Backend Issues

1. **Database Connection Errors**:
   - Check that `DATABASE_URL` is set correctly
   - Ensure Railway PostgreSQL service is running
   - Run migrations: `railway run npm run migrate`

2. **Gemini API Errors**:
   - Verify `GEMINI_API_KEY` is set and valid
   - Check API quota and billing in Google Cloud Console

3. **CORS Errors**:
   - Ensure frontend URL is added to CORS configuration
   - Check that API calls use the correct base URL

### Frontend Issues

1. **API Connection Errors**:
   - Verify `VITE_API_BASE_URL` points to your Railway backend
   - Check browser network tab for failed requests
   - Ensure backend is running and accessible

2. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript/ESLint errors

### Extension Issues

1. **Content Script Errors**:
   - Check browser console for JavaScript errors
   - Verify manifest permissions are correct
   - Test on different LinkedIn pages

2. **API Communication**:
   - Update `API_BASE_URL` in background.js
   - Check network requests in browser dev tools
   - Verify CORS headers allow extension origin

## Monitoring and Maintenance

1. **Railway Monitoring**:
   - Check deployment logs in Railway dashboard
   - Monitor database usage and performance
   - Set up alerts for downtime

2. **Netlify Monitoring**:
   - Check build logs for any issues
   - Monitor site performance and uptime
   - Review analytics for usage patterns

3. **Extension Updates**:
   - Test extension after Chrome updates
   - Monitor for LinkedIn DOM changes that might break scraping
   - Update selectors as needed

## Security Considerations

1. **API Keys**:
   - Never commit API keys to version control
   - Use environment variables for all secrets
   - Rotate keys regularly

2. **Database Security**:
   - Railway handles database security automatically
   - Regularly backup important data
   - Monitor for unusual access patterns

3. **Extension Security**:
   - Keep permissions minimal
   - Validate all scraped data
   - Use HTTPS for all API communications
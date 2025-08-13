# Testing Guide

## Overview

This document provides comprehensive testing instructions for the LinkedIn Job Tracker system.

## Automated Tests

### Backend Tests

Run backend unit tests:
```bash
cd backend
npm test
```

Tests cover:
- Database service operations
- API endpoint functionality
- Data validation and extraction
- Error handling

### Frontend Tests

Run frontend component tests:
```bash
cd frontend
npm test
```

Tests cover:
- Component rendering
- User interactions
- API integration
- Toast notifications

## Manual Testing

### 1. Extension Testing

#### Setup
1. Load the extension in Chrome (`chrome://extensions/`)
2. Open browser console for debugging
3. Navigate to test pages

#### LinkedIn Profile Testing
1. **Go to any LinkedIn profile** (e.g., `https://linkedin.com/in/someone`)
2. **Click the extension icon**
3. **Expected Results:**
   - Extension popup opens
   - Profile data is extracted and displayed
   - "Generate Connection Request" button appears
   - Data is sent to backend (check network tab)

#### Job Posting Testing
1. **Go to a job posting** (LinkedIn Jobs, Indeed, etc.)
2. **Click the extension icon**
3. **Expected Results:**
   - Job data is extracted and displayed
   - "Mark as Applied" button appears
   - Data is sent to backend

#### Message Rewrite Testing
1. **Go to LinkedIn messaging** (`https://linkedin.com/messaging/`)
2. **Open the extension popup**
3. **Enter a draft message**
4. **Click "Rewrite Message"**
5. **Expected Results:**
   - Conversation context is extracted
   - Multiple rewrite options are provided
   - Copy-to-clipboard functionality works

### 2. Backend API Testing

#### Health Check
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"OK","timestamp":"..."}`

#### Data Ingestion
```bash
curl -X POST http://localhost:3001/api/ingest/page \
  -H "Content-Type: application/json" \
  -d '{
    "classification": "linkedin_profile",
    "url": "https://linkedin.com/in/test",
    "extractedData": {
      "personName": "Test User",
      "profileUrl": "https://linkedin.com/in/test",
      "currentTitle": "Software Engineer"
    }
  }'
```

#### Connection Generation
```bash
curl -X POST http://localhost:3001/api/generate/connection \
  -H "Content-Type: application/json" \
  -d '{
    "targetProfile": {
      "personName": "Test User",
      "currentTitle": "Software Engineer",
      "currentCompany": "Test Company"
    }
  }'
```

### 3. Dashboard Testing

#### Access Dashboard
1. **Open** `http://localhost:5173`
2. **Verify** all three tabs load without errors

#### Connections Tab
1. **Search functionality**: Enter names/companies
2. **Status filtering**: Filter by connection status
3. **Actions**: Test "Generate Connection Request", "Mark Requested", etc.
4. **Copy functionality**: Test copy-to-clipboard buttons

#### Jobs Tab
1. **Status filtering**: Filter by application status
2. **Platform filtering**: Filter by job platforms
3. **Status updates**: Test "Mark Applied", "Interviewing", etc.
4. **Bulk actions**: Test "Mark All Viewed as Applied"

#### Companies Tab
1. **Add company**: Test manual company addition
2. **Expand/collapse**: Test company card expansion
3. **Follow-up generation**: Test follow-up message modal
4. **Profile links**: Test "View Profile" buttons

## Integration Testing

### End-to-End Workflow

#### Profile Tracking Workflow
1. **Extension**: Extract LinkedIn profile → Backend stores data
2. **Dashboard**: View profile in Connections tab
3. **Extension**: Generate connection request → Copy to clipboard
4. **Dashboard**: Mark connection as "Requested"
5. **Dashboard**: Later mark as "Accepted"

#### Job Application Workflow
1. **Extension**: Extract job posting → Backend stores data
2. **Dashboard**: View job in Jobs tab with "Viewed" status
3. **Extension**: Mark as applied → Status updates to "Applied"
4. **Dashboard**: Update status to "Interviewing" → "Offer"

### Database Integration
1. **Verify data persistence**: Check that extracted data appears in dashboard
2. **Test upserts**: Extract same profile/job multiple times
3. **Check relationships**: Verify outreach records link to profiles
4. **Test constraints**: Verify unique URL constraints work

## Performance Testing

### Extension Performance
- **Page load impact**: Measure page load time with/without extension
- **Memory usage**: Check extension memory consumption
- **DOM scraping speed**: Time data extraction on various pages

### API Performance
- **Response times**: Measure API endpoint response times
- **Concurrent requests**: Test multiple simultaneous requests
- **Database queries**: Check query performance with large datasets

### Dashboard Performance
- **Load times**: Measure dashboard load time with various data sizes
- **Search performance**: Test search with large datasets
- **Rendering performance**: Check table rendering with many rows

## Error Testing

### Extension Error Scenarios
1. **Network failures**: Test with backend offline
2. **Invalid pages**: Test on non-LinkedIn/job pages
3. **DOM changes**: Test with modified page structures
4. **Permission errors**: Test with restricted permissions

### Backend Error Scenarios
1. **Database connection failures**: Test with invalid DATABASE_URL
2. **Gemini API failures**: Test with invalid API key
3. **Invalid data**: Send malformed requests
4. **Rate limiting**: Test API rate limits

### Dashboard Error Scenarios
1. **API failures**: Test with backend offline
2. **Network timeouts**: Test with slow connections
3. **Invalid responses**: Test with malformed API responses
4. **Browser compatibility**: Test in different browsers

## Browser Extension Testing Script

Use the provided test script for manual extension testing:

1. **Load the test script**:
   ```javascript
   // Copy and paste extension/test-extension.js into browser console
   ```

2. **Run automated tests**:
   ```javascript
   window.testExtension.runAllTests();
   ```

3. **Run individual tests**:
   ```javascript
   window.testExtension.testLinkedInProfileExtraction();
   window.testExtension.testJobPostingExtraction();
   ```

## Test Data

### Sample LinkedIn Profile Data
```json
{
  "personName": "John Doe",
  "profileUrl": "https://linkedin.com/in/johndoe",
  "currentTitle": "Senior Software Engineer",
  "currentCompany": "Tech Corp",
  "location": "San Francisco, CA",
  "headline": "Passionate about building scalable systems",
  "about": "Experienced software engineer with 5+ years..."
}
```

### Sample Job Data
```json
{
  "jobTitle": "Full Stack Developer",
  "companyName": "Startup Inc",
  "platform": "linkedin",
  "jobUrl": "https://linkedin.com/jobs/123456",
  "location": "Remote",
  "applicationStatus": "viewed"
}
```

## Troubleshooting Tests

### Common Issues

1. **Extension not loading**:
   - Check manifest.json syntax
   - Verify permissions
   - Check browser console for errors

2. **Data extraction failing**:
   - Verify DOM selectors are current
   - Check for LinkedIn layout changes
   - Test on different profile types

3. **API connection issues**:
   - Verify backend is running
   - Check CORS configuration
   - Verify API URLs are correct

4. **Dashboard not loading**:
   - Check frontend build
   - Verify API base URL
   - Check browser network tab

### Debug Commands

```bash
# Check backend logs
cd backend && npm run dev

# Check frontend build
cd frontend && npm run build

# Test database connection
cd backend && node scripts/check_db.js

# Reset database for testing
cd backend && node scripts/reset_db.js && npm run migrate
```

## Continuous Testing

### Pre-deployment Checklist
- [ ] All automated tests pass
- [ ] Manual extension testing on 3+ LinkedIn profiles
- [ ] Manual job extraction testing on 3+ platforms
- [ ] Dashboard functionality verified
- [ ] API endpoints tested
- [ ] Database operations verified
- [ ] Error scenarios tested
- [ ] Performance acceptable

### Regular Testing Schedule
- **Daily**: Automated test runs
- **Weekly**: Manual extension testing on new LinkedIn profiles
- **Monthly**: Full integration testing
- **Before releases**: Complete test suite execution
# 🔧 Chrome Extension Setup & Testing Guide

## 📋 **Step-by-Step Extension Setup**

### **Step 1: Load Extension in Chrome**

1. **Open Chrome Extensions Page**:
   - Go to `chrome://extensions/`
   - Or click Chrome menu → More tools → Extensions

2. **Enable Developer Mode**:
   - Toggle "Developer mode" ON (top right corner)

3. **Load Unpacked Extension**:
   - Click "Load unpacked"
   - Navigate to your project folder
   - Select the `extension` folder
   - Click "Select Folder"

4. **Verify Extension Loaded**:
   - You should see "LinkedIn Job Tracker" in your extensions list
   - Extension icon should appear in Chrome toolbar
   - Status should show "Enabled"

### **Step 2: Test Extension Functionality**

#### **Test 1: LinkedIn Profile Extraction**

1. **Go to any LinkedIn profile**:
   - Example: `https://www.linkedin.com/in/anyone`

2. **Click the extension icon** in Chrome toolbar

3. **In the popup, click "Extract Page Data"**

4. **Expected Results**:
   - Status should show "Page data extracted successfully"
   - Page info should display the profile details
   - "Generate Connection Request" button should appear
   - "Message Rewrite" section should appear

5. **Test AI Features**:
   - Click "Generate Connection Request" → Should create personalized message
   - Enter text in "Message Rewrite" → Click "Rewrite Message" → Should provide options
   - Both should have "Copy to Clipboard" buttons

#### **Test 2: Job Posting Extraction**

1. **Go to any job posting**:
   - LinkedIn Jobs: `https://www.linkedin.com/jobs/`
   - Indeed: `https://www.indeed.com/`
   - Any job posting site

2. **Click the extension icon**

3. **Click "Extract Page Data"**

4. **Expected Results**:
   - Status should show "Page data extracted successfully"
   - Page info should display job details
   - "Mark as Applied" button should appear

5. **Test Job Tracking**:
   - Click "Mark as Applied" → Should update status
   - Check dashboard to see job appears

#### **Test 3: Dashboard Integration**

1. **Open Dashboard**: `http://localhost:5173/`

2. **Check Data Appears**:
   - Go to "LinkedIn Connections" tab → Should see extracted profiles
   - Go to "Jobs Applied" tab → Should see extracted jobs
   - Go to "Email Events" tab → Should see analytics

### **Step 3: Debugging Extension Issues**

#### **Check Browser Console**

1. **Open Developer Tools**:
   - Right-click on extension popup → "Inspect"
   - Or F12 → Console tab

2. **Look for Error Messages**:
   - Red error messages indicate issues
   - Check for network errors (API connection issues)
   - Check for permission errors

#### **Check Extension Console**

1. **Go to** `chrome://extensions/`

2. **Find LinkedIn Job Tracker**

3. **Click "Inspect views: service worker"**

4. **Check Console for Background Script Errors**

#### **Common Issues & Solutions**

**Issue 1: "Failed to extract page data"**
- **Solution**: Refresh the page and try again
- **Cause**: Content script not injected properly

**Issue 2: "Failed to send data to backend"**
- **Solution**: Ensure backend is running on `http://localhost:3001`
- **Test**: Visit `http://localhost:3001/health` (should return OK)

**Issue 3: AI features not working**
- **Solution**: Check GEMINI_API_KEY in backend/.env
- **Test**: Try generating connection request

**Issue 4: Extension icon not visible**
- **Solution**: Pin the extension to toolbar
- **How**: Click puzzle piece icon → Pin LinkedIn Job Tracker

### **Step 4: Test Complete Workflow**

#### **End-to-End Test**

1. **Extract LinkedIn Profile**:
   - Visit LinkedIn profile
   - Click extension → Extract Page Data
   - Generate connection request
   - Copy to clipboard

2. **Extract Job Posting**:
   - Visit job posting
   - Click extension → Extract Page Data
   - Mark as applied

3. **Check Dashboard**:
   - Open `http://localhost:5173/`
   - Verify profile appears in Connections tab
   - Verify job appears in Jobs tab
   - Check analytics in Email Events tab

4. **Test Email Monitoring**:
   - Send yourself a test job-related email
   - Wait 5 minutes (or trigger manual check)
   - Check Email Events tab for new events

## 🔧 **Extension Permissions Explained**

- **activeTab**: Access current tab content for data extraction
- **storage**: Store extracted data temporarily
- **scripting**: Inject content scripts into web pages
- **host_permissions**: Access LinkedIn and job sites

## 📊 **Expected Extension Behavior**

### **On LinkedIn Profiles**:
- ✅ Extract: Name, title, company, location, headline, about, experiences
- ✅ Generate: Personalized connection requests using AI
- ✅ Rewrite: LinkedIn messages with conversation context
- ✅ Store: Profile data in database via backend API

### **On Job Postings**:
- ✅ Extract: Job title, company, platform, URL, location, posted date
- ✅ Track: Application status (viewed → applied → interviewing → offer/rejected)
- ✅ Store: Job data in database via backend API

### **AI Features**:
- ✅ Connection requests: Personalized using Gemini AI
- ✅ Message rewriting: Context-aware improvements
- ✅ Copy to clipboard: Easy message copying

## 🚀 **Performance Tips**

1. **Keep Backend Running**: Extension needs backend API at `localhost:3001`
2. **Refresh Pages**: If extraction fails, refresh and try again
3. **Check Console**: Use browser dev tools for debugging
4. **Test on Different Sites**: Try various LinkedIn profiles and job sites

## 🎯 **Success Indicators**

- ✅ Extension loads without errors
- ✅ Data extraction works on LinkedIn and job sites
- ✅ AI features generate content
- ✅ Data appears in dashboard
- ✅ Email monitoring shows status as connected
- ✅ Copy to clipboard functions work

Your extension is now ready for production use! 🎉
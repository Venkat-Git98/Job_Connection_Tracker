# Troubleshooting Guide

## Current Issues and Solutions

### 1. 🔧 Service Worker MIME Type Error
**Error**: `The script has an unsupported MIME type ('text/html')`
**Status**: ✅ Fixed
**Solution**: 
- Service worker registration disabled
- Added service worker cleanup code to unregister any cached workers
- Added Netlify redirects to handle `/sw.js` requests properly

### 2. 🏢 Adding Company Not Working
**Error**: Companies can't be added from the frontend
**Likely Causes**:
1. Database schema mismatch (missing `user_id` columns)
2. User context not being passed properly
3. Database connection issues

**Solutions Applied**:
- ✅ Added schema detection to handle both single-user and multi-user databases
- ✅ Enhanced error handling with detailed error messages
- ✅ Created fallback queries for tables without `user_id` columns
- ✅ Added comprehensive logging for debugging

### 3. 📊 Analytics Errors
**Error**: `column "user_id" does not exist`
**Status**: ✅ Fixed
**Solution**: Analytics routes now detect schema and adapt queries accordingly

## 🚀 Quick Fixes to Run

### Fix 1: Check and Fix Database Schema
```bash
node backend/scripts/check_and_fix_schema.js
```
This will:
- Check your database structure
- Clean up dummy data
- Report schema status
- Fix common issues

### Fix 2: Clean Service Worker Cache
The frontend now automatically unregisters any cached service workers, but you can also:
1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in the left sidebar
4. Click "Unregister" on any registered workers

### Fix 3: Test Adding Company
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try adding a company
4. Check for detailed error messages

## 🔍 Debugging Steps

### For Adding Company Issues:

1. **Check User Context**:
   - Open DevTools → Network tab
   - Try adding a company
   - Check if the request has `X-User-ID` header
   - If missing, check if a user is selected in the app

2. **Check Database Connection**:
   - Look at backend logs for database errors
   - Verify `DATABASE_URL` environment variable is set

3. **Check API Response**:
   - Look at the Network tab in DevTools
   - Check the response from `/api/outreach/add-company`
   - Look for specific error messages

### For Service Worker Issues:

1. **Clear Browser Cache**:
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Or clear all browser data for the site

2. **Check Network Tab**:
   - Look for requests to `/sw.js`
   - Should return 404, not HTML

## 🛠 Manual Database Fixes

If the automatic scripts don't work, you can manually run these SQL commands:

### Check Table Structure:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check if user_id columns exist
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'user_id' AND table_schema = 'public';
```

### Clean Dummy Data:
```sql
-- Delete test companies
DELETE FROM profiles WHERE current_company IN (
  'Google', 'Microsoft', 'OpenAI', 'Netflix', 'Apple', 'Amazon'
);

-- Delete test jobs
DELETE FROM jobs WHERE company_name IN (
  'Google', 'Microsoft', 'OpenAI', 'Netflix', 'Apple', 'Amazon'
);
```

### Add User ID Columns (if needed):
```sql
-- Add user_id to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT 1;

-- Add user_id to profiles table  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT 1;

-- Add user_id to email_events table
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT 1;
```

## 📱 Extension Issues

The content script errors are likely from:
1. **Axios cancelToken issues**: Fixed with better error handling
2. **Message port closing**: Fixed with proper async handling
3. **Sentry rate limiting**: Reduced by fixing underlying errors

## 🎯 Expected Results After Fixes

1. **✅ Service Worker**: No more MIME type errors
2. **✅ Adding Companies**: Should work with proper error messages
3. **✅ Analytics**: Should load without user_id errors
4. **✅ Extension**: Better error handling, fewer console errors
5. **✅ Sentry**: Reduced error spam

## 🔄 Testing Steps

1. **Run the schema check**:
   ```bash
   node backend/scripts/check_and_fix_schema.js
   ```

2. **Restart backend server**

3. **Hard refresh frontend** (Ctrl+F5)

4. **Test adding a company**:
   - Go to Companies tab
   - Enter a company name
   - Click "Add Company"
   - Check console for detailed logs

5. **Check analytics**:
   - Should load without errors
   - Should show clean data (no dummy entries)

## 📞 If Issues Persist

1. **Check backend logs** for detailed error messages
2. **Check browser console** for frontend errors
3. **Verify environment variables** are set correctly
4. **Check database connection** is working
5. **Run database migrations** if needed

The fixes should resolve the main issues you're experiencing!
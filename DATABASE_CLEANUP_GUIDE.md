# Database Cleanup Guide

The analytics dashboard is showing dummy data because test/sample data was seeded into the database. Here are several ways to clean it up:

## 🎯 **Quick Solution: Clean Dummy Data Only**

This is the **recommended approach** - it removes test data while preserving any real data you might have:

### Option 1: Command Line (Fastest)
```bash
# Navigate to your project directory
cd your-project-directory

# Run the dummy data cleanup script
node backend/scripts/cleanup_dummy_data.js
```

### Option 2: Admin Panel (User-Friendly)
1. Add the AdminPanel component to your app navigation
2. Access the Admin Panel in your frontend
3. Click "Clean Dummy Data" button
4. Confirm the action

## ⚠️ **Nuclear Option: Clean All Data**

**WARNING**: This deletes EVERYTHING including any real data you might have added.

### Command Line
```bash
# This will delete ALL data (use with caution!)
node backend/scripts/cleanup_all_data.js
```

### Admin Panel
1. Access the Admin Panel
2. Click "Delete All Data" button
3. Confirm the dangerous action

## 📊 **What Gets Removed**

### Dummy Data Cleanup (Recommended)
✅ **Removes:**
- Jobs from test companies (Google, Microsoft, OpenAI, Netflix, Apple, Amazon, Meta, Tesla, Uber, Airbnb, Stripe, Spotify)
- Sample profiles (John Doe, Jane Smith, Test User, etc.)
- Test URLs and dummy data
- Old test data (older than 30 days)
- Related email events

✅ **Preserves:**
- Any real job applications you've tracked
- Real LinkedIn connections
- Actual email events
- User accounts

### Complete Data Cleanup (Nuclear)
❌ **Removes EVERYTHING:**
- All job applications
- All connections/profiles
- All email events
- All users (except admin)
- Resets auto-increment sequences

## 🔧 **Adding Admin Panel to Your App**

If you want to use the Admin Panel UI, add it to your navigation:

### 1. Import the component
```javascript
import AdminPanel from './components/modern/AdminPanel'
```

### 2. Add to your routing
```javascript
// In your main app or routing component
{currentUser?.username === 'venkat' && (
  <Route path="/admin" component={AdminPanel} />
)}
```

### 3. Add navigation link
```javascript
// In your navigation menu
{currentUser?.username === 'venkat' && (
  <NavLink to="/admin">⚙️ Admin Panel</NavLink>
)}
```

## 🚀 **After Cleanup**

1. **Refresh your browser** to clear any cached data
2. **Check the analytics dashboard** - it should now show zero or minimal data
3. **Start using the Chrome extension** to track real jobs and connections
4. **Your analytics will now show only real data** as you use the system

## 📈 **Expected Results**

### Before Cleanup
- Analytics showing fake data from Google, Microsoft, etc.
- Sample connections and profiles
- Test email events

### After Cleanup
- Clean analytics dashboard with zero or minimal real data
- No dummy companies or fake profiles
- Fresh start for tracking real job applications

## 🛠 **Troubleshooting**

### If cleanup fails:
1. Check database connection in `.env` file
2. Ensure PostgreSQL is running
3. Check console output for specific errors
4. Try running with admin privileges

### If data still appears:
1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Check if cleanup actually ran successfully
4. Verify database connection

## 📝 **Manual Verification**

You can verify the cleanup worked by checking record counts:

```sql
-- Connect to your database and run:
SELECT 
  (SELECT COUNT(*) FROM jobs) as jobs,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM email_events) as email_events,
  (SELECT COUNT(*) FROM users) as users;
```

After dummy data cleanup, you should see significantly fewer records, with only real data remaining.

## 🎯 **Recommendation**

**Use the "Clean Dummy Data" option first** - it's safer and will solve your analytics issue while preserving any real data you might have. Only use "Clean All Data" if you want to start completely fresh and don't mind losing everything.
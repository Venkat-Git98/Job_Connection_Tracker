# Email Monitoring Improvements - Hourly Monitoring & Duplicate Prevention

## Overview
The email monitoring system has been updated to address two key issues:
1. **Monitoring Frequency**: Changed from 5-minute intervals to hourly monitoring
2. **Duplicate Email Entries**: Implemented comprehensive deduplication to prevent processing the same email multiple times

## Changes Made

### 1. Hourly Monitoring Implementation

#### Backend Changes (`gmailImapService.js`)
- **Default Interval**: Changed from 5 minutes to 60 minutes (1 hour)
- **Monitoring Control**: Added proper start/stop functionality with interval management
- **Interval Tracking**: Added `monitoringInterval` property to track and clear intervals

```javascript
async startMonitoring(intervalMinutes = 60) { // Default to 1 hour
  // Clear any existing interval
  if (this.monitoringInterval) {
    clearInterval(this.monitoringInterval);
  }
  
  // Set up hourly checking
  this.monitoringInterval = setInterval(async () => {
    console.log(`🔄 Periodic email check starting at ${new Date().toISOString()}`);
    await this.checkForJobEmails();
  }, intervalMinutes * 60 * 1000);
}
```

#### API Routes (`email.js`)
- **Start Monitoring**: Default interval changed to 60 minutes
- **Stop Monitoring**: Added new endpoint to stop monitoring
- **Better Control**: Proper interval management and cleanup

#### Frontend Changes (`EmailMonitorHub.jsx`)
- **UI Updates**: Changed button text to "Start Hourly Monitoring"
- **Status Display**: Shows "Monitoring every hour" instead of "every 5 minutes"
- **Stop Button**: Added stop monitoring functionality
- **Instructions**: Updated setup instructions to reflect hourly monitoring

### 2. Duplicate Email Prevention

#### Database Schema Updates
**New Migration**: `add_email_deduplication.js`
- Added `email_message_id` column for unique email identification
- Added indexes for faster duplicate checking
- Added unique constraint on message IDs

```sql
ALTER TABLE email_events 
ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON email_events(email_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_dedup ON email_events(email_subject, email_from, processed_at);

ALTER TABLE email_events 
ADD CONSTRAINT IF NOT EXISTS unique_email_message 
UNIQUE (email_message_id) DEFERRABLE INITIALLY DEFERRED;
```

#### In-Memory Deduplication
**Process Tracking**: Added `processedEmails` Set to track processed emails in memory
```javascript
constructor() {
  this.processedEmails = new Set(); // Track processed email IDs
}
```

**Email Key Generation**: Creates unique keys for emails based on message ID, subject, sender, and date
```javascript
const emailKey = `${emailData.messageId || emailData.subject}_${emailData.from}_${emailData.date}`;
if (this.processedEmails.has(emailKey)) {
  console.log(`📧 Skipping already processed email: ${emailData.subject}`);
  return;
}
```

#### Database-Level Deduplication
**Duplicate Check**: Before storing, check if similar email exists within 1 hour window
```javascript
const checkQuery = `
  SELECT id FROM email_events 
  WHERE email_subject = $1 AND email_from = $2 AND 
        ABS(EXTRACT(EPOCH FROM (processed_at - $3))) < 3600
  LIMIT 1;
`;
```

**Smart Storage**: Only store if no duplicate found within the time window

### 3. Cleanup Utilities

#### Duplicate Cleanup Script
**Purpose**: Remove existing duplicate emails from the database
**Location**: `backend/scripts/cleanup_duplicate_emails.js`

**Features**:
- Identifies duplicates based on subject, sender, and hour timestamp
- Keeps the first occurrence, removes subsequent duplicates
- Provides detailed logging of cleanup process

**Usage**:
```bash
node backend/scripts/cleanup_duplicate_emails.js
```

#### Database Migration Script
**Purpose**: Add deduplication columns and indexes
**Location**: `backend/scripts/add_email_deduplication.js`

**Usage**:
```bash
node backend/scripts/add_email_deduplication.js
```

## Benefits

### 1. Reduced Server Load
- **60x Less Frequent**: Monitoring every hour instead of every 5 minutes
- **Fewer API Calls**: Reduced Gmail IMAP connections
- **Better Resource Usage**: Less CPU and memory consumption

### 2. No More Duplicates
- **In-Memory Prevention**: Immediate duplicate detection during processing
- **Database Prevention**: Secondary check before storage
- **Unique Constraints**: Database-level enforcement of uniqueness

### 3. Better User Experience
- **Cleaner Email Lists**: No duplicate entries in the UI
- **Accurate Statistics**: Correct counts and analytics
- **Reliable Monitoring**: Consistent hourly checks without overlap

## Technical Implementation

### Deduplication Strategy
1. **Level 1 - In-Memory**: Check processed emails set
2. **Level 2 - Database**: Query for similar emails within 1-hour window
3. **Level 3 - Constraints**: Database unique constraints as final safeguard

### Monitoring Strategy
1. **Hourly Intervals**: Reasonable frequency for job email monitoring
2. **Proper Cleanup**: Clear intervals when stopping monitoring
3. **Error Handling**: Reconnection logic for failed checks

## Migration Steps

### 1. Run Database Migrations
```bash
# Add deduplication columns and indexes
node backend/scripts/add_email_deduplication.js

# Clean up existing duplicates
node backend/scripts/cleanup_duplicate_emails.js
```

### 2. Restart Email Monitoring
1. Stop current monitoring (if running)
2. Start new hourly monitoring
3. Verify no duplicates are created

### 3. Verify Changes
- Check email events table for duplicates
- Monitor system resources (should be lower)
- Confirm hourly monitoring frequency

## Expected Results

### Before Changes
- ❌ Email checks every 5 minutes (288 times per day)
- ❌ Multiple entries for same emails
- ❌ High server resource usage
- ❌ Inaccurate statistics due to duplicates

### After Changes
- ✅ Email checks every hour (24 times per day)
- ✅ No duplicate email entries
- ✅ Reduced server resource usage (60x less frequent)
- ✅ Accurate statistics and clean data

## Monitoring and Maintenance

### 1. Regular Checks
- Monitor email_events table for any new duplicates
- Check system logs for monitoring frequency
- Verify hourly monitoring is working correctly

### 2. Performance Monitoring
- Track database query performance with new indexes
- Monitor memory usage of processedEmails set
- Check IMAP connection stability with hourly intervals

### 3. Data Quality
- Periodically run duplicate cleanup script
- Monitor email classification accuracy
- Verify job status updates are still working correctly

## Conclusion

These improvements address both the monitoring frequency and duplicate entry issues:

1. **Hourly Monitoring**: Reduces system load while maintaining effective job email tracking
2. **Comprehensive Deduplication**: Prevents duplicate entries at multiple levels
3. **Better Resource Management**: More efficient use of server resources
4. **Improved Data Quality**: Clean, accurate email event data

The system now operates more efficiently while providing the same level of job email monitoring functionality.
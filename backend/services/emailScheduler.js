const cron = require('node-cron');
const gmailImapService = require('./gmailImapService');

class EmailScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  start(cronExpression = '*/5 * * * *') { // Every 5 minutes by default
    if (this.isRunning) {
      console.log('📧 Email monitoring is already running');
      return;
    }

    console.log(`📧 Starting email monitoring with cron: ${cronExpression}`);
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      try {
        console.log('🔍 Checking for new job emails...');
        const jobEmails = await gmailImapService.checkForJobEmails();
        
        if (jobEmails.length > 0) {
          console.log(`📬 Processed ${jobEmails.length} job-related emails`);
        }
      } catch (error) {
        console.error('❌ Email monitoring error:', error);
      }
    }, {
      scheduled: false
    });

    this.cronJob.start();
    this.isRunning = true;
    
    // Also do an initial check
    this.performInitialCheck();
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('📧 Email monitoring stopped');
  }

  async performInitialCheck() {
    try {
      console.log('🔍 Performing initial email check...');
      const jobEmails = await gmailImapService.checkForJobEmails();
      console.log(`📬 Initial check found ${jobEmails.length} job-related emails`);
    } catch (error) {
      console.error('❌ Initial email check failed:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: gmailImapService.lastCheckedDate,
      connected: gmailImapService.isConnected
    };
  }
}

module.exports = new EmailScheduler();
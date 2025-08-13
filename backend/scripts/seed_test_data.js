const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding test data...');
    
    // Sample job applications
    const jobs = [
      {
        title: 'Senior Software Engineer',
        company: 'Google',
        platform: 'linkedin',
        url: 'https://linkedin.com/jobs/google-swe',
        status: 'applied',
        location: 'Mountain View, CA',
        applied_date: '2024-01-15'
      },
      {
        title: 'Full Stack Developer',
        company: 'Microsoft',
        platform: 'indeed',
        url: 'https://indeed.com/microsoft-fullstack',
        status: 'interviewing',
        location: 'Seattle, WA',
        applied_date: '2024-01-12'
      },
      {
        title: 'Machine Learning Engineer',
        company: 'OpenAI',
        platform: 'greenhouse',
        url: 'https://openai.greenhouse.io/ml-engineer',
        status: 'rejected',
        location: 'San Francisco, CA',
        applied_date: '2024-01-10'
      },
      {
        title: 'Data Scientist',
        company: 'Netflix',
        platform: 'lever',
        url: 'https://netflix.lever.co/data-scientist',
        status: 'offer',
        location: 'Los Gatos, CA',
        applied_date: '2024-01-08'
      },
      {
        title: 'DevOps Engineer',
        company: 'Amazon',
        platform: 'linkedin',
        url: 'https://linkedin.com/jobs/amazon-devops',
        status: 'viewed',
        location: 'Austin, TX'
      }
    ];

    // Insert jobs
    for (const job of jobs) {
      await client.query(`
        INSERT INTO jobs (job_title, company_name, platform, job_url, location, application_status, applied_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
        ON CONFLICT (job_url) DO NOTHING
      `, [job.title, job.company, job.platform, job.url, job.location, job.status, job.applied_date]);
    }

    // Sample email events
    const emailEvents = [
      {
        job_id: 1,
        type: 'application_confirmation',
        subject: 'Thank you for your application - Senior Software Engineer',
        from: 'noreply@google.com',
        content: 'Thank you for your interest in the Senior Software Engineer position at Google.'
      },
      {
        job_id: 2,
        type: 'assessment',
        subject: 'Technical Assessment - Full Stack Developer',
        from: 'recruiting@microsoft.com',
        content: 'Please complete the technical assessment for the Full Stack Developer position.'
      },
      {
        job_id: 3,
        type: 'rejection',
        subject: 'Update on your application',
        from: 'talent@openai.com',
        content: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.'
      },
      {
        job_id: 4,
        type: 'offer',
        subject: 'Job Offer - Data Scientist Position',
        from: 'hr@netflix.com',
        content: 'We are pleased to extend an offer for the Data Scientist position at Netflix.'
      },
      {
        job_id: 2,
        type: 'interview_invite',
        subject: 'Interview Invitation - Microsoft',
        from: 'recruiting@microsoft.com',
        content: 'We would like to schedule an interview for the Full Stack Developer position.'
      }
    ];

    // Insert email events
    for (const email of emailEvents) {
      await client.query(`
        INSERT INTO email_events (job_id, email_type, email_subject, email_from, email_content, processed_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 20)} days')
      `, [email.job_id, email.type, email.subject, email.from, email.content]);
    }

    // Sample LinkedIn profiles
    const profiles = [
      {
        name: 'John Smith',
        url: 'https://linkedin.com/in/johnsmith',
        title: 'Senior Engineering Manager',
        company: 'Google',
        location: 'Mountain View, CA',
        headline: 'Building the future of search and AI'
      },
      {
        name: 'Sarah Johnson',
        url: 'https://linkedin.com/in/sarahjohnson',
        title: 'VP of Engineering',
        company: 'Microsoft',
        location: 'Seattle, WA',
        headline: 'Leading cloud infrastructure teams'
      },
      {
        name: 'Mike Chen',
        url: 'https://linkedin.com/in/mikechen',
        title: 'ML Research Scientist',
        company: 'OpenAI',
        location: 'San Francisco, CA',
        headline: 'Advancing artificial general intelligence'
      }
    ];

    // Insert profiles
    for (const profile of profiles) {
      await client.query(`
        INSERT INTO profiles (person_name, profile_url, current_title, current_company, location, headline, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 45)} days')
        ON CONFLICT (profile_url) DO NOTHING
      `, [profile.name, profile.url, profile.title, profile.company, profile.location, profile.headline]);
    }

    console.log('✅ Test data seeded successfully!');
    console.log('📊 You can now view the dashboard with sample data');
    
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData();
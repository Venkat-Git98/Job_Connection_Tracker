# CareerTracker - Professional Job Search Management

A comprehensive multi-user job search management system with Chrome extension, backend API, and React dashboard. Features AI-powered LinkedIn integration, connection tracking, and application monitoring using Google Gemini.

## 🚀 Features

- **🔍 Automatic Data Extraction**: Click the extension on LinkedIn profiles or job pages to automatically extract and store data
- **🤖 AI Connection Requests**: Generate personalized LinkedIn connection requests using Gemini AI
- **✍️ Message Rewriting**: Rewrite LinkedIn messages with conversation context using AI
- **📊 Dashboard**: Web interface with three tabs to manage connections, jobs, and companies
- **🌐 Multi-Platform Support**: Works with LinkedIn, Indeed, Greenhouse, Lever, Workday, and more
- **📈 Analytics**: Track response rates, application status, and networking progress

## 📁 Project Structure

```
careertracker/
├── extension/          # Chrome extension (Manifest v3)
│   ├── manifest.json   # Extension configuration
│   ├── background.js   # Service worker
│   ├── content.js      # DOM scraping logic
│   └── popup.html/js   # Extension popup UI
├── backend/           # Node.js Express API
│   ├── server.js      # Main server file
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   └── scripts/       # Database migrations
├── frontend/          # React dashboard
│   ├── src/           # React components
│   └── dist/          # Built files
└── README.md
```

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set up Environment
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_postgresql_connection_string
```

### 3. Set up Database
```bash
cd backend
npm run migrate
```

### 4. Start Development Servers
```bash
# Start both backend and frontend
npm run dev

# Or start individually:
# Backend: cd backend && npm run dev
# Frontend: cd frontend && npm run dev
```

### 5. Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select the `extension` folder
4. The extension icon should appear in your Chrome toolbar

## 🎯 Usage Guide

### 1. Track LinkedIn Profiles
- Navigate to any LinkedIn profile
- Click the extension icon in your toolbar
- The profile data will be automatically extracted and stored

### 2. Track Job Applications
- Visit job postings on LinkedIn, Indeed, Greenhouse, etc.
- Click the extension icon to save the job details
- Use "Mark as Applied" to update application status

### 3. Generate AI Connection Requests
- After tracking a LinkedIn profile, click "Generate Connection Request"
- The AI will create a personalized message based on the person's profile
- Copy the generated message and use it on LinkedIn

### 4. Rewrite Messages with AI
- When composing LinkedIn messages, use the "Message Rewrite" feature
- The AI will analyze conversation context and improve your message
- Get multiple rewrite options (Professional & Warm)

### 5. Manage Data in Dashboard
- Access the web dashboard at `http://localhost:5173`
- **Connections Tab**: View all LinkedIn profiles, track connection status
- **Jobs Tab**: Manage job applications, update status, add notes
- **Companies Tab**: See contacts grouped by company, generate follow-ups

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Summary:

**Backend (Railway):**
1. Connect GitHub repo to Railway
2. Set environment variables
3. Deploy automatically

**Frontend (Netlify):**
1. Connect GitHub repo to Netlify
2. Set build settings: `frontend` folder, `npm run build`, `dist` output
3. Deploy automatically

**Extension:**
- Update API URL in `extension/background.js`
- Load as unpacked extension in Chrome

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon
npm test            # Run tests
npm run migrate     # Run database migrations
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm test           # Run tests
```

### Extension Development
- Make changes to extension files
- Click "Reload" in `chrome://extensions/` to update
- Check browser console for debugging

## 🧪 Testing

### Manual Testing Checklist

**Extension:**
- [ ] Extract LinkedIn profile data
- [ ] Extract job posting data
- [ ] Generate connection requests
- [ ] Rewrite messages with context
- [ ] Mark jobs as applied

**Dashboard:**
- [ ] View connections with search/filter
- [ ] View jobs with status filtering
- [ ] View companies grouped data
- [ ] Update connection/job status
- [ ] Generate follow-up messages

**API:**
- [ ] Health check endpoint
- [ ] Data ingestion endpoints
- [ ] Gemini integration
- [ ] Database operations

## 📊 Database Schema

```sql
-- Profiles: LinkedIn profile data
profiles (id, person_name, profile_url, current_title, current_company, ...)

-- Jobs: Job application tracking
jobs (id, job_title, company_name, platform, job_url, application_status, ...)

-- Outreach: Connection tracking
outreach (id, profile_id, connection_status, connection_request_text, ...)

-- Messages: Optional message history
messages (id, profile_id, job_id, direction, body, ...)
```

## 🔧 Configuration

### Environment Variables

**Backend:**
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=development
PORT=3001
```

**Frontend:**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Extension Configuration
- Update `API_BASE_URL` in `extension/background.js` for production
- Modify DOM selectors in `extension/content.js` if LinkedIn changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature description"`
5. Push and create a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting section](DEPLOYMENT.md#troubleshooting) in DEPLOYMENT.md
2. Review browser console for errors
3. Check API server logs
4. Verify environment variables are set correctly

## 🎉 Acknowledgments

- Built with React, Node.js, and PostgreSQL
- AI powered by Google Gemini
- Deployed on Railway and Netlify
- Chrome Extension using Manifest v3
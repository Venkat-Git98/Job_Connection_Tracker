import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/modern/Layout'
import ConnectionsHub from './components/modern/ConnectionsHub'
import JobsHub from './components/modern/JobsHub'
import CompaniesHub from './components/modern/CompaniesHub'
import EmailMonitorHub from './components/modern/EmailMonitorHub'
import AnalyticsHub from './components/modern/AnalyticsHub'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="app animate-fade-in">
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/connections" replace />} />
              <Route path="/connections" element={<ConnectionsHub />} />
              <Route path="/jobs" element={<JobsHub />} />
              <Route path="/companies" element={<CompaniesHub />} />
              <Route path="/emails" element={<EmailMonitorHub />} />
              <Route path="/analytics" element={<AnalyticsHub />} />
            </Routes>
          </Layout>
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
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
import { UserProvider, useUser } from './contexts/UserContext'

// Protected Email Route Component
const ProtectedEmailRoute = () => {
  const { currentUser } = useUser()
  
  // Check if current user has email access (only Venkat)
  const hasEmailAccess = currentUser && (
    currentUser.username === 'venkat' || 
    currentUser.preferences?.email_access === true
  )
  
  if (!hasEmailAccess) {
    return <Navigate to="/connections" replace />
  }
  
  return <EmailMonitorHub />
}

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connections" replace />} />
      <Route path="/connections" element={<ConnectionsHub />} />
      <Route path="/jobs" element={<JobsHub />} />
      <Route path="/companies" element={<CompaniesHub />} />
      <Route path="/emails" element={<ProtectedEmailRoute />} />
      <Route path="/analytics" element={<AnalyticsHub />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <div className="app animate-fade-in">
            <Layout>
              <AppRoutes />
            </Layout>
          </div>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
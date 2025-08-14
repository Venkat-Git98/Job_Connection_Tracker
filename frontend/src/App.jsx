import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/modern/Layout'
import Dashboard from './components/modern/Dashboard'
import ConnectionsHub from './components/modern/ConnectionsHub'
import JobsHub from './components/modern/JobsHub'
import CompaniesHub from './components/modern/CompaniesHub'
import AnalyticsHub from './components/modern/AnalyticsHub'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LoadingScreen from './components/modern/LoadingScreen'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="app animate-fade-in">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/connections" element={<ConnectionsHub />} />
              <Route path="/jobs" element={<JobsHub />} />
              <Route path="/companies" element={<CompaniesHub />} />
              <Route path="/analytics" element={<AnalyticsHub />} />
            </Routes>
          </Layout>
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ConnectionsTab from './components/ConnectionsTab'
import JobsTab from './components/JobsTab'
import CompaniesTab from './components/CompaniesTab'
import EmailEventsTab from './components/EmailEventsTab'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/connections" element={<ConnectionsTab />} />
          <Route path="/jobs" element={<JobsTab />} />
          <Route path="/companies" element={<CompaniesTab />} />
          <Route path="/emails" element={<EmailEventsTab />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}

export default App
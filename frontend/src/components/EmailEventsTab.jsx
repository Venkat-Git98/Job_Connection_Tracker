import React, { useState, useEffect } from 'react';
import Skeleton from './shared/Skeleton';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import DataTable from './shared/DataTable';
import StatusBadge from './shared/StatusBadge';
import AnalyticsDashboard from './AnalyticsDashboard';

const EmailEventsTab = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadEmailEvents();
    loadMonitoringStatus();
  }, []);

  const loadEmailEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmailEvents({ 
        type: typeFilter !== 'all' ? typeFilter : undefined 
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to load email events:', error);
      showError('Failed to load email events');
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringStatus = async () => {
    try {
      const response = await apiService.getEmailMonitoringStatus();
      setMonitoringStatus(response.data.status);
    } catch (error) {
      console.error('Failed to load monitoring status:', error);
    }
  };

  const handleManualCheck = async () => {
    try {
      setLoading(true);
      const response = await apiService.checkEmailsNow();
      showSuccess(`Found ${response.data.emails.length} new job-related emails`);
      loadEmailEvents();
    } catch (error) {
      console.error('Manual email check failed:', error);
      showError('Failed to check emails');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setEventToDelete(eventId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = async () => {
    try {
      await apiService.deleteEmailEvent(eventToDelete);
      showSuccess('Email event deleted successfully');
      setShowDeleteConfirm(false);
      setEventToDelete(null);
      loadEmailEvents(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete email event:', error);
      showError('Failed to delete email event');
    }
  };

  const getEmailTypeColor = (type) => {
    const colors = {
      rejection: '#c62828',
      assessment: '#ef6c00',
      interview_invite: '#1565c0',
      offer: '#2e7d32',
      update: '#666',
      other: '#999'
    };
    return colors[type] || '#666';
  };

  const columns = [
    {
      key: 'processedAt',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span 
          style={{ 
            color: getEmailTypeColor(value),
            fontWeight: '600',
            textTransform: 'capitalize'
          }}
        >
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (value) => (
        <div style={{ maxWidth: '300px' }} className="text-truncate">
          {value}
        </div>
      )
    },
    {
      key: 'from',
      label: 'From',
      render: (value) => (
        <div style={{ maxWidth: '200px' }} className="text-truncate">
          {value}
        </div>
      )
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (value, row) => value || 'Unknown'
    },
    {
      key: 'jobTitle',
      label: 'Job',
      render: (value) => value || 'N/A'
    },
    {
      key: 'metadata',
      label: 'Details',
      render: (value) => {
        if (!value) return 'N/A';
        
        const metadata = typeof value === 'string' ? JSON.parse(value) : value;
        
        return (
          <div style={{ fontSize: '12px' }}>
            {metadata.confidence && (
              <div>Confidence: {metadata.confidence}%</div>
            )}
            {metadata.deadline && (
              <div>Deadline: {metadata.deadline}</div>
            )}
            {metadata.assessmentLink && (
              <div>
                <a 
                  href={metadata.assessmentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0a66c2' }}
                >
                  Assessment Link
                </a>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => handleDeleteEvent(row.id)}
          className="btn btn-sm"
          style={{ 
            background: '#dc3545', 
            color: 'white', 
            border: '1px solid #dc3545',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Delete this email event"
        >
          🗑️ Delete
        </button>
      )
    }
  ];

  const filteredEvents = events.filter(event => 
    typeFilter === 'all' || event.type === typeFilter
  );

  // Calculate stats
  const stats = {
    total: events.length,
    rejection: events.filter(e => e.type === 'rejection').length,
    assessment: events.filter(e => e.type === 'assessment').length,
    interview_invite: events.filter(e => e.type === 'interview_invite').length,
    offer: events.filter(e => e.type === 'offer').length,
    other: events.filter(e => !['rejection', 'assessment', 'interview_invite', 'offer'].includes(e.type)).length
  };

  return (
    <div>
      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
      
      {/* Email Events Section */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">📧 Email Monitoring Details</h2>
        </div>
        
        {/* Monitoring Status */}
        {monitoringStatus ? (
          <div className="mb-3 p-3" style={{ background: '#f8f9fa', borderRadius: '6px' }}>
            <div className="d-flex align-items-center gap-3">
              <div>
                <strong>Status:</strong> 
                <span style={{ 
                  color: monitoringStatus.connected ? '#057642' : '#c62828',
                  marginLeft: '8px'
                }}>
                  {monitoringStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
              </div>
              <div>
                <strong>Last Check:</strong> 
                {monitoringStatus.lastCheck ? 
                  new Date(monitoringStatus.lastCheck).toLocaleString() : 
                  'Never'
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-3" style={{ background: '#f8f9fa', borderRadius: '6px' }}>
            <Skeleton width={120} height={16} />
            <div className="mt-2"><Skeleton width={200} height={14} /></div>
          </div>
        )}

        {/* Stats */}
        <div className="d-flex gap-4 mb-3">
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#0a66c2' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Events</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#c62828' }}>
              {stats.rejection}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Rejections</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef6c00' }}>
              {stats.assessment}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Assessments</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1565c0' }}>
              {stats.interview_invite}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Interviews</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#2e7d32' }}>
              {stats.offer}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Offers</div>
          </div>
        </div>

        {/* Controls */}
        <div className="d-flex gap-3 mb-3" style={{ marginTop: 'var(--space-4)' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select"
            style={{ width: '200px' }}
          >
            <option value="all">All Types</option>
            <option value="rejection">Rejections</option>
            <option value="assessment">Assessments</option>
            <option value="interview_invite">Interview Invites</option>
            <option value="offer">Offers</option>
            <option value="update">Updates</option>
            <option value="other">Other</option>
          </select>
          
          <button onClick={handleManualCheck} disabled={loading} className="btn btn-primary">
            {loading ? 'Checking...' : 'Check Emails Now'}
          </button>
          
          <button
            onClick={loadEmailEvents}
            className="btn btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="card">
        <DataTable
          data={filteredEvents}
          columns={columns}
          loading={loading}
          emptyMessage="No email events found. Email monitoring will automatically detect job-related emails."
        />
      </div>

      {/* Setup Instructions */}
      {(!monitoringStatus || !monitoringStatus.connected) && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Setup Gmail Monitoring</h3>
          </div>
          <div>
            <p>To enable automatic email monitoring:</p>
            <ol>
              <li>Enable 2-Factor Authentication on your Gmail account</li>
              <li>Generate an App Password: Google Account → Security → App passwords</li>
              <li>Add the app password to your backend environment variables</li>
              <li>Restart the backend server</li>
            </ol>
            <p style={{ color: '#666', fontSize: '14px' }}>
              The system will automatically check for job-related emails every 5 minutes and update your job statuses accordingly.
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>
              Confirm Delete
            </h3>
            
            <p style={{ margin: '0 0 8px 0' }}>
              Are you sure you want to delete this email event?
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn"
                style={{ 
                  background: '#dc3545', 
                  color: 'white', 
                  border: '1px solid #dc3545' 
                }}
                onClick={confirmDeleteEvent}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailEventsTab;
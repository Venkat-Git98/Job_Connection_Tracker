import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import DataTable from './shared/DataTable';
import StatusBadge from './shared/StatusBadge';
import ActionButtons from './shared/ActionButtons';

const ConnectionsTab = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedConnections, setSelectedConnections] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadConnections();
    loadStats();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await apiService.getConnections({ 
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined 
      });
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
      showError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getConnectionStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadConnections();
  };

  const handleDeleteConnection = async (profileId) => {
    setConnectionToDelete(profileId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteConnection = async () => {
    try {
      await apiService.deleteConnection(connectionToDelete);
      showSuccess('Connection deleted successfully');
      setShowDeleteConfirm(false);
      setConnectionToDelete(null);
      loadConnections();
      loadStats();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      showError('Failed to delete connection');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConnections.size === 0) {
      showError('Please select connections to delete');
      return;
    }

    try {
      const profileIds = Array.from(selectedConnections);
      await apiService.bulkDeleteConnections(profileIds);
      showSuccess(`Successfully deleted ${profileIds.length} connections`);
      setSelectedConnections(new Set());
      loadConnections();
      loadStats();
    } catch (error) {
      console.error('Failed to bulk delete connections:', error);
      showError('Failed to delete selected connections');
    }
  };

  const handleSelectConnection = (profileId) => {
    const newSelected = new Set(selectedConnections);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedConnections(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedConnections.size === filteredConnections.length) {
      setSelectedConnections(new Set());
    } else {
      setSelectedConnections(new Set(filteredConnections.map(conn => conn.id)));
    }
  };

  const handleStatusUpdate = async (profileId, newStatus) => {
    try {
      await apiService.updateConnectionStatus(profileId, newStatus);
      showSuccess(`Connection status updated to ${newStatus}`);
      loadConnections();
      loadStats();
    } catch (error) {
      console.error('Failed to update status:', error);
      showError('Failed to update connection status');
    }
  };

  const handleCopyConnectionText = async (text) => {
    if (!text) {
      showError('No connection request text available');
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showSuccess('Connection request copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text:', error);
      showError('Failed to copy to clipboard');
    }
  };

  const handleGenerateConnection = async (profile) => {
    try {
      const response = await apiService.generateConnection(profile);
      showSuccess('New connection request generated');
      
      // Copy to clipboard automatically
      if (response.data.connectionRequest) {
        await navigator.clipboard.writeText(response.data.connectionRequest);
        showSuccess('Connection request copied to clipboard');
      }
      
      loadConnections(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to generate connection:', error);
      showError('Failed to generate connection request');
    }
  };

  // Calculate filtered connections
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchTerm || 
      connection.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.currentTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || connection.connectionStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedConnections.size === filteredConnections.length && filteredConnections.length > 0}
          onChange={handleSelectAll}
          style={{ margin: 0 }}
        />
      ),
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedConnections.has(row.id)}
          onChange={() => handleSelectConnection(row.id)}
          style={{ margin: 0 }}
        />
      )
    },
    {
      key: 'personName',
      label: 'Name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.currentTitle}
          </div>
        </div>
      )
    },
    {
      key: 'currentCompany',
      label: 'Company',
      render: (value) => value || 'N/A'
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => value || 'N/A'
    },
    {
      key: 'connectionStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={value} type="connection" />
    },
    {
      key: 'lastContactDate',
      label: 'Last Contact',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <ActionButtons
          items={[
            {
              label: 'View Profile',
              onClick: () => window.open(row.profileUrl, '_blank'),
              variant: 'secondary'
            },
            {
              label: 'Generate Request',
              onClick: () => handleGenerateConnection(row),
              variant: 'primary'
            },
            {
              label: 'Follow Up',
              onClick: () => {
                const msg = `Hi ${row.personName?.split(' ')[0] || ''}, just following up on my connection request.`;
                handleCopyConnectionText(msg);
              },
              variant: 'secondary'
            },
            ...(row.connectionRequestText ? [{
              label: 'Copy Request',
              onClick: () => handleCopyConnectionText(row.connectionRequestText),
              variant: 'secondary'
            }] : []),
            {
              label: 'Mark Requested',
              onClick: () => handleStatusUpdate(row.id, 'requested'),
              variant: 'success',
              show: row.connectionStatus === 'none'
            },
            {
              label: 'Mark Accepted',
              onClick: () => handleStatusUpdate(row.id, 'accepted'),
              variant: 'success',
              show: row.connectionStatus === 'requested'
            },
            {
              label: 'Delete',
              onClick: () => handleDeleteConnection(row.id),
              variant: 'danger'
            }
          ].filter(item => item.show !== false)}
        />
      )
    }
  ];

  return (
    <div>
      {/* Header with Stats */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">LinkedIn Connections</h2>
        </div>
        
        {stats && (
          <div className="d-flex gap-4 mb-3">
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#0a66c2' }}>
                {stats.totalProfiles}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Profiles</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#057642' }}>
                {stats.accepted}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Accepted</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef6c00' }}>
                {stats.requested}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Requested</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#666' }}>
                {stats.notContacted}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Not Contacted</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="d-flex gap-3 mb-3" style={{ marginTop: 'var(--space-4)' }}>
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ flex: 1 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: '200px' }}
          >
            <option value="all">All Statuses</option>
            <option value="none">Not Contacted</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {/* Bulk Actions */}
        {selectedConnections.size > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {selectedConnections.size} connection{selectedConnections.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="btn"
              style={{ 
                background: '#dc3545', 
                color: 'white', 
                border: '1px solid #dc3545',
                padding: '6px 12px',
                fontSize: '14px'
              }}
            >
              🗑️ Delete Selected ({selectedConnections.size})
            </button>
          </div>
        )}
      </div>

      {/* Connections Table */}
      <div className="card">
        <DataTable
          data={filteredConnections}
          columns={columns}
          loading={loading}
          emptyMessage="No connections found. Start by using the Chrome extension to track LinkedIn profiles."
        />
      </div>

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
              Are you sure you want to delete this connection?
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
                onClick={confirmDeleteConnection}
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

export default ConnectionsTab;
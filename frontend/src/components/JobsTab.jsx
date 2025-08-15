import React, { useState, useEffect } from 'react';
import Skeleton from './shared/Skeleton';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import DataTable from './shared/DataTable';
import StatusBadge from './shared/StatusBadge';
import ActionButtons from './shared/ActionButtons';

const JobsTab = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getJobs({ 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      showError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs();
  };

  const handleStatusUpdate = async (jobUrl, newStatus) => {
    try {
      await apiService.updateJobStatus(jobUrl, newStatus);
      showSuccess(`Job status updated to ${newStatus}`);
      loadJobs();
    } catch (error) {
      console.error('Failed to update status:', error);
      showError('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    setJobToDelete(jobId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteJob = async () => {
    try {
      await apiService.deleteJob(jobToDelete);
      showSuccess('Job deleted successfully');
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      loadJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
      showError('Failed to delete job');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) {
      showError('Please select jobs to delete');
      return;
    }

    try {
      const jobIds = Array.from(selectedJobs);
      await apiService.bulkDeleteJobs(jobIds);
      showSuccess(`Successfully deleted ${jobIds.length} jobs`);
      setSelectedJobs(new Set());
      loadJobs();
    } catch (error) {
      console.error('Failed to bulk delete jobs:', error);
      showError('Failed to delete selected jobs');
    }
  };

  const handleSelectJob = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id)));
    }
  };

  const handleMarkApplied = async (jobUrl) => {
    try {
      await apiService.markJobAsApplied(jobUrl);
      showSuccess('Job marked as applied');
      loadJobs();
    } catch (error) {
      console.error('Failed to mark as applied:', error);
      showError('Failed to mark job as applied');
    }
  };

  const handleAddNote = async (jobUrl, note) => {
    if (!note.trim()) return;
    
    try {
      await apiService.addJobNote(jobUrl, note);
      showSuccess('Note added successfully');
      loadJobs();
    } catch (error) {
      console.error('Failed to add note:', error);
      showError('Failed to add note');
    }
  };

  // Calculate filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.applicationStatus === statusFilter;
    const matchesPlatform = platformFilter === 'all' || job.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
          onChange={handleSelectAll}
          style={{ margin: 0 }}
        />
      ),
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedJobs.has(row.id)}
          onChange={() => handleSelectJob(row.id)}
          style={{ margin: 0 }}
        />
      )
    },
    {
      key: 'jobTitle',
      label: 'Job Title',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.platform}
          </div>
        </div>
      )
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (value) => value || 'N/A'
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => value || 'Remote/N/A'
    },
    {
      key: 'applicationStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={value} type="job" />
    },
    {
      key: 'appliedDate',
      label: 'Applied Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Not Applied'
    },
    {
      key: 'postedDate',
      label: 'Posted Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <ActionButtons
          items={[
            {
              label: 'View Job',
              onClick: () => window.open(row.jobUrl, '_blank'),
              variant: 'secondary'
            },
            {
              label: 'Mark Applied',
              onClick: () => handleMarkApplied(row.jobUrl),
              variant: 'success',
              show: row.applicationStatus === 'viewed'
            },
            {
              label: 'Add Quick Note',
              onClick: () => {
                const note = prompt('Add a quick note (e.g., recruiter name, next step):');
                if (note) handleAddNote(row.jobUrl, note);
              },
              variant: 'secondary'
            },
            {
              label: 'Interviewing',
              onClick: () => handleStatusUpdate(row.jobUrl, 'interviewing'),
              variant: 'primary',
              show: row.applicationStatus === 'applied'
            },
            {
              label: 'Rejected',
              onClick: () => handleStatusUpdate(row.jobUrl, 'rejected'),
              variant: 'danger',
              show: ['applied', 'interviewing'].includes(row.applicationStatus)
            },
            {
              label: 'Got Offer',
              onClick: () => handleStatusUpdate(row.jobUrl, 'offer'),
              variant: 'success',
              show: row.applicationStatus === 'interviewing'
            },
            {
              label: 'Add Note',
              onClick: () => {
                const note = prompt('Add a note for this job:');
                if (note) handleAddNote(row.jobUrl, note);
              },
              variant: 'secondary'
            },
            {
              label: 'Delete',
              onClick: () => handleDeleteJob(row.id),
              variant: 'danger'
            }
          ].filter(item => item.show !== false)}
        />
      )
    }
  ];

  // Get unique platforms for filter
  const platforms = [...new Set(jobs.map(job => job.platform))].sort();

  // Calculate stats
  const stats = {
    total: jobs.length,
    viewed: jobs.filter(j => j.applicationStatus === 'viewed').length,
    applied: jobs.filter(j => j.applicationStatus === 'applied').length,
    interviewing: jobs.filter(j => j.applicationStatus === 'interviewing').length,
    offers: jobs.filter(j => j.applicationStatus === 'offer').length,
    rejected: jobs.filter(j => j.applicationStatus === 'rejected').length
  };

  return (
    <div>
      {/* Header with Stats */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Job Applications</h2>
        </div>
        
        <div className="d-flex gap-4 mb-3">
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#0a66c2' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Jobs</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#057642' }}>
              {stats.applied}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Applied</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef6c00' }}>
              {stats.interviewing}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Interviewing</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1b5e20' }}>
              {stats.offers}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Offers</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#c62828' }}>
              {stats.rejected}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Rejected</div>
          </div>
        </div>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="d-flex gap-3 mb-3" style={{ marginTop: 'var(--space-4)' }}>
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ flex: 1 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: '150px' }}
          >
            <option value="all">All Statuses</option>
            <option value="viewed">Viewed</option>
            <option value="applied">Applied</option>
             <option value="interviewing">Interviewing</option>
             <option value="assessment">Assessment</option>
            <option value="rejected">Rejected</option>
            <option value="offer">Offer</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="form-select"
            style={{ width: '150px' }}
          >
            <option value="all">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {/* Bulk Actions */}
        {selectedJobs.size > 0 && (
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
              {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
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
              🗑️ Delete Selected ({selectedJobs.size})
            </button>
          </div>
        )}
      </div>

      {/* Jobs Table */}
      <div className="card">
        <DataTable
          data={filteredJobs}
          columns={columns}
          loading={loading}
          emptyMessage="No jobs found. Start by using the Chrome extension to track job postings."
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="d-flex gap-3">
          <button
            onClick={() => handleSearch()}
            className="btn btn-secondary"
          >
            Refresh Data
          </button>
          <button
            onClick={() => {
              const viewedJobs = jobs.filter(j => j.applicationStatus === 'viewed');
              if (viewedJobs.length === 0) {
                showError('No viewed jobs to mark as applied');
                return;
              }
              if (confirm(`Mark all ${viewedJobs.length} viewed jobs as applied?`)) {
                Promise.all(viewedJobs.map(job => handleMarkApplied(job.jobUrl)))
                  .then(() => showSuccess(`Marked ${viewedJobs.length} jobs as applied`))
                  .catch(() => showError('Failed to update some jobs'));
              }
            }}
            className="btn btn-success"
            disabled={stats.viewed === 0}
          >
            Mark All Viewed as Applied ({stats.viewed})
          </button>
        </div>
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
              Are you sure you want to delete this job?
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              This action cannot be undone and will also delete any related email events.
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
                onClick={confirmDeleteJob}
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

export default JobsTab;
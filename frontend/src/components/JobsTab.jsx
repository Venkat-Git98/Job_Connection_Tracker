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

  const columns = [
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
            }
          ].filter(item => item.show !== false)}
        />
      )
    }
  ];

  // Get unique platforms for filter
  const platforms = [...new Set(jobs.map(job => job.platform))].sort();

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.applicationStatus === statusFilter;
    const matchesPlatform = platformFilter === 'all' || job.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

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
    </div>
  );
};

export default JobsTab;
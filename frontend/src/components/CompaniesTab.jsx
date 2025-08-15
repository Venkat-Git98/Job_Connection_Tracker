import React, { useState, useEffect } from 'react';
import Skeleton from './shared/Skeleton';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from './shared/StatusBadge';
import ActionButtons from './shared/ActionButtons';
import FollowUpModal from './FollowUpModal';

const CompaniesTab = () => {
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesResponse, summaryResponse] = await Promise.all([
        apiService.getOutreach(),
        apiService.getOutreachSummary()
      ]);
      
      setCompanies(companiesResponse.data.companies || []);
      setSummary(summaryResponse.data.summary || []);
    } catch (error) {
      console.error('Failed to load companies data:', error);
      showError('Failed to load companies data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    try {
      await apiService.addCompany(newCompanyName.trim());
      showSuccess(`Company "${newCompanyName}" added successfully`);
      setNewCompanyName('');
      loadData();
    } catch (error) {
      console.error('Failed to add company:', error);
      showError(error.response?.data?.message || 'Failed to add company');
    }
  };

  const handleGenerateFollowUp = (profile, company) => {
    setSelectedProfile({ ...profile, companyName: company.companyName });
    setShowFollowUpModal(true);
  };

  const companyColumns = [
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'last', label: 'Last Contact' },
    { key: 'actions', label: 'Actions' },
  ];

  const handleFollowUpGenerated = () => {
    setShowFollowUpModal(false);
    setSelectedProfile(null);
    showSuccess('Follow-up message generated successfully');
  };

  const handleDeleteCompany = async (companyName) => {
    setCompanyToDelete(companyName);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCompany = async () => {
    try {
      await apiService.deleteCompany(companyToDelete);
      showSuccess(`Company "${companyToDelete}" deleted successfully`);
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete company:', error);
      showError('Failed to delete company');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Companies & People Reached</h2>
        </div>
        <div className="d-flex flex-column gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton width={220} height={20} />
              <div className="mt-2"><Skeleton width={320} height={14} /></div>
              <div className="mt-4"><Skeleton width="100%" height={40} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Companies & People Reached</h2>
        </div>
        
        {/* Add Company Form */}
        <form onSubmit={handleAddCompany} className="d-flex gap-3 mb-4" style={{ marginTop: 'var(--space-4)' }}>
          <input
            type="text"
            placeholder="Add company name manually..."
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Add Company
          </button>
        </form>

        {/* Summary Stats */}
        {summary.length > 0 && (
          <div className="mb-4">
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Summary Statistics</h3>
            <div className="d-flex gap-4">
              <div className="text-center">
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#0a66c2' }}>
                  {summary.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Companies</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#057642' }}>
                  {summary.reduce((sum, c) => sum + c.totalContacts, 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Contacts</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef6c00' }}>
                  {summary.reduce((sum, c) => sum + c.accepted, 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Accepted</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#666' }}>
                  {summary.length > 0 ? 
                    (summary.reduce((sum, c) => sum + parseFloat(c.responseRate), 0) / summary.length).toFixed(1) 
                    : 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Avg Response Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Companies List */}
      {companies.length === 0 ? (
        <div className="card">
          <div className="text-center p-4" style={{ color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <div>No companies found. Start by tracking LinkedIn profiles or add companies manually.</div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {companies.map((company, index) => (
            <CompanyCard
              key={index}
              company={company}
              onGenerateFollowUp={handleGenerateFollowUp}
              onViewProfile={(url) => window.open(url, '_blank')}
              onDeleteCompany={handleDeleteCompany}
            />
          ))}
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedProfile && (
        <FollowUpModal
          profile={selectedProfile}
          onClose={() => setShowFollowUpModal(false)}
          onGenerated={handleFollowUpGenerated}
        />
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
              Confirm Delete Company
            </h3>
            
            <p style={{ margin: '0 0 8px 0' }}>
              Are you sure you want to delete <strong>"{companyToDelete}"</strong>?
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              This will permanently delete the company and all associated profiles. This action cannot be undone.
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
                onClick={confirmDeleteCompany}
              >
                Delete Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CompanyCard = ({ company, onGenerateFollowUp, onViewProfile, onDeleteCompany }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <div 
        className="d-flex justify-content-between align-items-center"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {company.companyName}
          </h3>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            {company.totalContacts} contacts • {company.contactedCount} contacted • {company.acceptedCount} accepted
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div style={{ fontSize: '14px', color: '#666' }}>
            {company.contactedCount > 0 ? 
              `${((company.acceptedCount / company.contactedCount) * 100).toFixed(1)}% response rate` 
              : 'No contacts yet'
            }
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCompany(company.companyName);
            }}
            className="btn btn-sm"
            style={{ 
              background: '#dc3545', 
              color: 'white', 
              border: '1px solid #dc3545',
              padding: '4px 8px',
              fontSize: '12px',
              borderRadius: '4px',
              marginRight: '8px'
            }}
            title="Delete company and all associated profiles"
          >
            🗑️
          </button>
          <span style={{ fontSize: '18px', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e1e5e9' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Last Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {company.profiles.map((profile, index) => (
                  <tr key={profile.id || index}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{profile.person_name}</div>
                    </td>
                    <td>{profile.current_title || 'N/A'}</td>
                    <td>
                      <StatusBadge status={profile.connection_status || 'none'} type="connection" />
                    </td>
                    <td>
                      {profile.last_contact_date ? 
                        new Date(profile.last_contact_date).toLocaleDateString() : 
                        'Never'
                      }
                    </td>
                    <td>
                      <ActionButtons
                        items={[
                          {
                            label: 'View Profile',
                            onClick: () => onViewProfile(profile.profile_url),
                            variant: 'secondary'
                          },
                          {
                            label: 'Generate Follow-up',
                            onClick: () => onGenerateFollowUp(profile, company),
                            variant: 'primary'
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
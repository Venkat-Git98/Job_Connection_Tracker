import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useUser } from '../../contexts/UserContext'

const CompaniesHub = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { showError } = useToast()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentUser) {
      loadCompanies()
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadCompanies()
    }
  }, [searchTerm])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const response = await apiService.getCompanies({ 
        search: searchTerm || undefined
      })
      
      // Transform outreach summary data to companies format
      const companiesData = response.data.summary || []
      const transformedCompanies = companiesData.map(company => ({
        id: company.companyName,
        name: company.companyName,
        industry: 'Technology', // Default since we don't have this data
        jobCount: 0, // We don't have job data linked to companies yet
        connectionCount: company.totalContacts,
        size: company.totalContacts > 50 ? '50+' : company.totalContacts > 10 ? '10-50' : '1-10',
        linkedinId: company.companyName.toLowerCase().replace(/\s+/g, '-'),
        website: `https://google.com/search?q=${encodeURIComponent(company.companyName)}`
      }))
      
      setCompanies(transformedCompanies)
    } catch (error) {
      console.error('Failed to load companies:', error)
      // Don't show error, just use empty array
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadCompanies()
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="companies-hub">
      {/* Header */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <h2 className="card-title">
            <span>🏢</span>
            Companies & Organizations
          </h2>
          <p className="card-subtitle">
            Research and track companies you're interested in
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search companies by name or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Companies Grid */}
      <div className="companies-grid animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="company-card-skeleton">
              <div className="skeleton skeleton-avatar"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          ))
        ) : filteredCompanies.length > 0 ? (
          filteredCompanies.map((company, index) => (
            <div 
              key={company.id || index} 
              className="company-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="company-header">
                <div className="company-logo">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} />
                  ) : (
                    <span className="company-initial">
                      {company.name?.charAt(0) || '🏢'}
                    </span>
                  )}
                </div>
                <div className="company-info">
                  <h3 className="company-name">{company.name || 'Unknown Company'}</h3>
                  <p className="company-industry">{company.industry || 'Unknown Industry'}</p>
                </div>
              </div>
              
              <div className="company-stats">
                <div className="stat">
                  <span className="stat-value">{company.jobCount || 0}</span>
                  <span className="stat-label">Jobs</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{company.connectionCount || 0}</span>
                  <span className="stat-label">Connections</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{company.size || 'N/A'}</span>
                  <span className="stat-label">Size</span>
                </div>
              </div>

              <div className="company-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.open(`https://linkedin.com/company/${company.linkedinId || company.name}`, '_blank')}
                >
                  View LinkedIn
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.open(company.website || `https://google.com/search?q=${company.name}`, '_blank')}
                >
                  Visit Website
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No Companies Found</h3>
            <p>Start tracking companies by using the Chrome extension on LinkedIn company pages.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .companies-hub {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .search-form {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .search-form .form-input {
          flex: 1;
        }

        .companies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-6);
        }

        .company-card,
        .company-card-skeleton {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          transition: var(--transition-normal);
          animation: slideInUp 0.5s ease-out;
        }

        .company-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
          border-color: var(--border-accent);
        }

        .company-card-skeleton {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          min-height: 200px;
          justify-content: center;
        }

        .company-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .company-logo {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .company-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .company-initial {
          font-size: var(--text-xl);
          font-weight: 700;
          color: white;
        }

        .company-info {
          flex: 1;
          min-width: 0;
        }

        .company-name {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--space-1) 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .company-industry {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .company-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-6);
          padding: var(--space-4);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-value {
          font-size: var(--text-lg);
          font-weight: 800;
          background: var(--gradient-warning);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        .company-actions {
          display: flex;
          gap: var(--space-3);
        }

        .company-actions .btn {
          flex: 1;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--space-12);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4);
        }

        .empty-state h3 {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-3);
        }

        .empty-state p {
          font-size: var(--text-base);
          color: var(--text-muted);
          max-width: 400px;
          margin: 0 auto;
          line-height: var(--leading-relaxed);
        }

        @media (max-width: 768px) {
          .search-form {
            flex-direction: column;
            align-items: stretch;
          }

          .companies-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .company-card {
            padding: var(--space-4);
          }

          .company-header {
            margin-bottom: var(--space-4);
          }

          .company-stats {
            margin-bottom: var(--space-4);
          }

          .company-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default CompaniesHub
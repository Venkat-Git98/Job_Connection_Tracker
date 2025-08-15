import React, { useState } from 'react'
import { useUser } from '../../contexts/UserContext'
import { useToast } from '../../contexts/ToastContext'

const UserSelector = () => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    createUser, 
    loading,
    validateUsername,
    validateDisplayName,
    isUsernameAvailable
  } = useUser()
  const { showSuccess, showError } = useToast()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    displayName: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  const handleUserSwitch = async (userId) => {
    try {
      const user = await switchUser(parseInt(userId))
      showSuccess(`Switched to ${user.displayName}`)
    } catch (error) {
      showError(error.message)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setFormErrors({})
    
    // Validate inputs
    const errors = {}
    
    const usernameValidation = validateUsername(formData.username)
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.error
    } else if (!isUsernameAvailable(formData.username)) {
      errors.username = 'This username is already taken'
    }
    
    const displayNameValidation = validateDisplayName(formData.displayName)
    if (!displayNameValidation.valid) {
      errors.displayName = displayNameValidation.error
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      setIsCreating(true)
      const user = await createUser(formData.username, formData.displayName)
      showSuccess(`Welcome, ${user.displayName}!`)
      setShowCreateForm(false)
      setFormData({ username: '', displayName: '' })
    } catch (error) {
      showError(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="user-selector loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="user-selector">
      {currentUser ? (
        // Current User Display
        <div className="current-user-display">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{currentUser.displayName}</div>
              <div className="user-username">@{currentUser.username}</div>
            </div>
          </div>
          
          <div className="user-actions">
            <select 
              value={currentUser.id} 
              onChange={(e) => handleUserSwitch(e.target.value)}
              className="user-switch-select"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
            
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-create-user"
              title="Create New User"
            >
              ➕
            </button>
          </div>
        </div>
      ) : (
        // User Selection Interface
        <div className="user-selection">
          <div className="selection-header">
            <h3>👤 Select User Profile</h3>
            <p>Choose your profile to continue</p>
          </div>
          
          {users.length > 0 ? (
            <div className="user-list">
              {users.map(user => (
                <div 
                  key={user.id} 
                  className="user-card"
                  onClick={() => handleUserSwitch(user.id)}
                >
                  <div className="user-avatar">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.displayName}</div>
                    <div className="user-stats">
                      {user.stats?.profiles || 0} profiles • {user.stats?.jobs || 0} jobs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-users">
              <p>No users found. Create your first profile to get started.</p>
            </div>
          )}
          
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn-primary create-first-user"
          >
            ➕ Create New User
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🆕 Create User Profile</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="create-user-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="e.g., johnsmith"
                  maxLength="50"
                  className={formErrors.username ? 'error' : ''}
                />
                {formErrors.username && (
                  <div className="form-error">{formErrors.username}</div>
                )}
                <div className="form-hint">Letters and numbers only, 2-50 characters</div>
              </div>
              
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="e.g., John Smith"
                  maxLength="255"
                  className={formErrors.displayName ? 'error' : ''}
                />
                {formErrors.displayName && (
                  <div className="form-error">{formErrors.displayName}</div>
                )}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-selector {
          position: relative;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-6);
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-primary);
          border-top: 3px solid var(--primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .current-user-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
          min-width: 0;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-lg);
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-username {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: 500;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .user-switch-select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--bg-glass-light);
          color: var(--text-primary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .user-switch-select:hover {
          border-color: var(--border-accent);
        }

        .btn-create-user {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: white;
          font-size: var(--text-base);
          cursor: pointer;
          transition: var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-create-user:hover {
          transform: scale(1.1);
        }

        .user-selection {
          padding: var(--space-6);
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .selection-header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .selection-header h3 {
          font-size: var(--text-xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-2);
        }

        .selection-header p {
          color: var(--text-muted);
          font-size: var(--text-sm);
          margin: 0;
        }

        .user-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-accent);
        }

        .user-stats {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 500;
        }

        .no-users {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-muted);
        }

        .create-first-user {
          width: 100%;
          padding: var(--space-4);
          border: none;
          border-radius: var(--radius-2xl);
          background: var(--gradient-primary);
          color: white;
          font-size: var(--text-base);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .create-first-user:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-4);
        }

        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-8);
          max-width: 500px;
          width: 100%;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: var(--shadow-2xl);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }

        .modal-header h3 {
          font-size: var(--text-xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: var(--bg-glass-light);
          color: var(--text-muted);
          font-size: var(--text-xl);
          cursor: pointer;
          transition: var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: var(--bg-glass);
          color: var(--text-primary);
        }

        .create-user-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-group label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-group input {
          padding: var(--space-4);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          background: var(--bg-glass-light);
          color: var(--text-primary);
          font-size: var(--text-base);
          transition: var(--transition-normal);
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group input.error {
          border-color: var(--error-500);
        }

        .form-error {
          font-size: var(--text-xs);
          color: var(--error-500);
          font-weight: 500;
        }

        .form-hint {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: flex-end;
        }

        .btn-secondary, .btn-primary {
          padding: var(--space-3) var(--space-6);
          border: none;
          border-radius: var(--radius-xl);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .btn-secondary {
          background: var(--bg-glass);
          color: var(--text-muted);
          border: 1px solid var(--border-primary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-glass-light);
          color: var(--text-primary);
        }

        .btn-primary {
          background: var(--gradient-primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        .btn-secondary:disabled, .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default UserSelector
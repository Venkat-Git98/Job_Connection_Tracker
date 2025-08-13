import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const FollowUpModal = ({ profile, onClose, onGenerated }) => {
  const [draftMessage, setDraftMessage] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleGenerateFollowUp = async () => {
    if (!draftMessage.trim()) {
      showError('Please enter a draft message');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.rewriteMessage({
        draftMessage: draftMessage.trim(),
        targetProfile: {
          personName: profile.person_name,
          currentTitle: profile.current_title,
          currentCompany: profile.companyName
        }
      });

      setGeneratedOptions(response.data.options || []);
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
      showError('Failed to generate follow-up message');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (message) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const ta = document.createElement('textarea');
        ta.value = message;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showSuccess('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
      showError('Failed to copy to clipboard');
    }
  };

  const handleUseMessage = (message) => {
    handleCopyMessage(message);
    onGenerated();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 style={{ margin: 0 }}>Generate Follow-up Message</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Profile Info */}
        <div style={{
          background: '#f8f9fa',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: '600' }}>{profile.person_name}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {profile.current_title} at {profile.companyName}
          </div>
        </div>

        {/* Draft Message Input */}
        <div className="form-group">
          <label className="form-label">Your Draft Message:</label>
          <textarea
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            className="form-input"
            rows={4}
            placeholder="Enter your draft follow-up message here..."
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="d-flex gap-2 mb-4">
          <button
            onClick={handleGenerateFollowUp}
            disabled={loading || !draftMessage.trim()}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading" style={{ width: '16px', height: '16px' }}></span>
                Generating...
              </>
            ) : (
              'Generate Follow-up Options'
            )}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>

        {/* Generated Options */}
        {generatedOptions.length > 0 && (
          <div>
            <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>Generated Options:</h4>
            {generatedOptions.map((option, index) => (
              <div
                key={index}
                style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  border: '1px solid #e1e5e9'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong style={{ color: '#0a66c2' }}>{option.type}:</strong>
                  <div className="d-flex gap-1">
                    <button
                      onClick={() => handleCopyMessage(option.message)}
                      className="btn btn-secondary btn-sm"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleUseMessage(option.message)}
                      className="btn btn-primary btn-sm"
                    >
                      Use This
                    </button>
                  </div>
                </div>
                <div style={{ 
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px'
                }}>
                  {option.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpModal;
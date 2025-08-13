import React, { useState, useRef, useEffect } from 'react';

const ActionButtons = ({ items = [] }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  // Filter out hidden items
  const visibleItems = items.filter(item => item.show !== false);

  if (visibleItems.length === 0) {
    return null;
  }

  // If only one or two items, show them as buttons
  if (visibleItems.length <= 2) {
    return (
      <div className="d-flex gap-1">
        {visibleItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`btn btn-${item.variant || 'secondary'} btn-sm`}
            disabled={item.disabled}
            title={item.title}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  // For more items, show a consolidated dropdown only to avoid overlap
  const dropdownItems = visibleItems;

  return (
    <div className="d-flex gap-1" style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px' }}
          aria-haspopup="menu"
          aria-expanded={showDropdown}
        >
          Actions ⋯
        </button>
        
        {showDropdown && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
              onClick={() => setShowDropdown(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                marginTop: '2px'
              }}
              role="menu"
            >
              {dropdownItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setShowDropdown(false);
                  }}
                  disabled={item.disabled}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: item.disabled ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!item.disabled) {
                      e.target.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                  role="menuitem"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
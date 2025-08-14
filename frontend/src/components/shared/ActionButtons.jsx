import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DropdownPortal = ({ buttonRef, onClose, items }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 150 // Align to right edge
      });
    }
  }, [buttonRef]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        zIndex: 1100,
        minWidth: '150px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      role="menu"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          disabled={item.disabled}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: item.disabled ? 0.6 : 1,
            color: 'var(--text-primary)',
            transition: 'all 0.2s ease',
            borderRadius: '6px',
            margin: '2px'
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.target.style.background = 'var(--bg-glass-light)';
              e.target.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = 'var(--text-primary)';
          }}
          role="menuitem"
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
};

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
      <div 
        style={{ position: 'relative' }} 
        ref={dropdownRef}
        className={showDropdown ? 'dropdown-open' : ''}
      >
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
                zIndex: 1099
              }}
              onClick={() => setShowDropdown(false)}
            />
            <DropdownPortal
              buttonRef={dropdownRef}
              onClose={() => setShowDropdown(false)}
              items={dropdownItems}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
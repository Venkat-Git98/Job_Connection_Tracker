import React from 'react';

const Skeleton = ({ width = '100%', height = 16, rounded = false, style = {} }) => {
  const styles = {
    width,
    height,
    borderRadius: rounded ? '9999px' : '8px',
    background: 'linear-gradient(90deg, rgba(148,163,184,0.15), rgba(148,163,184,0.35), rgba(148,163,184,0.15))',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
    boxShadow: 'var(--shadow-sm)'
  };
  return <div style={{ ...styles, ...style }} />;
};

export default Skeleton;




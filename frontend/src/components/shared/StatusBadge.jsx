import React from 'react';
import Skeleton from './Skeleton';

const StatusBadge = ({ status, type = 'job' }) => {
  const getStatusClass = (status, type) => {
    if (type === 'job') {
      switch (status) {
        case 'viewed': return 'status-viewed';
        case 'applied': return 'status-applied';
        case 'interviewing': return 'status-interviewing';
        case 'assessment': return 'status-interviewing';
        case 'rejected': return 'status-rejected';
        case 'offer': return 'status-offer';
        default: return 'status-viewed';
      }
    } else if (type === 'connection') {
      switch (status) {
        case 'none': return 'status-none';
        case 'requested': return 'status-requested';
        case 'accepted': return 'status-accepted';
        case 'declined': return 'status-declined';
        default: return 'status-none';
      }
    }
    return 'status-none';
  };

  const getStatusText = (status, type) => {
    if (type === 'connection' && status === 'none') {
      return 'Not Contacted';
    }
    return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
  };

  if (!status) {
    return <Skeleton width={90} height={20} rounded />;
  }

  return (
    <span className={`status-badge ${getStatusClass(status, type)}`}>
      {getStatusText(status, type)}
    </span>
  );
};

export default StatusBadge;
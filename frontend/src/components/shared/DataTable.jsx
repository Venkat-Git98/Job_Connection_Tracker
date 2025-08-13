import React from 'react';
import Skeleton from './Skeleton';

const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false, 
  emptyMessage = 'No data available',
  onRowClick 
}) => {
  if (loading) {
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={{ minWidth: column.minWidth }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={`${column.key}-${rowIndex}`}>
                    <Skeleton width="100%" height={16} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-4" style={{ color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table" role="grid">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={{ minWidth: column.minWidth }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr 
              key={row.id || index}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render 
                    ? column.render(row[column.key], row, index)
                    : row[column.key] || '-'
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
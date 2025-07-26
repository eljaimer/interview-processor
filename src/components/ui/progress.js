import React from 'react';

export const Progress = ({ value = 0, className = '' }) => (
  <div className={`relative w-full overflow-hidden rounded-full bg-gray-200 h-2 ${className}`}>
    <div
      className="h-full bg-blue-600 transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
    />
  </div>
);

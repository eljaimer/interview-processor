import React from 'react';

export const Badge = ({ children, className = '', variant = 'default' }) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variantClasses = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-700'
  };

  return (
    
      {children}
    
  );
};

import React from 'react';

export const Button = ({ children, onClick, disabled, className = '', variant = 'default', size = 'default', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
    : 'bg-blue-600 text-white hover:bg-blue-700 shadow';
  const sizeClasses = size === 'sm' ? 'h-9 px-3 text-xs' : 'h-10 py-2 px-4';

  return (
    
      {children}
    
  );
};

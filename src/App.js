import React from 'react';
import AdvancedInterviewProcessor from './components/AdvancedInterviewProcessor';

function App() {
  return (
    
      
    
  );
}

export default App;
```

---

## 🔧 UI COMPONENTS (Create these files):

### src/components/ui/card.js
```javascript
import React from 'react';

export const Card = ({ children, className = '' }) => (
  
    {children}
  
);

export const CardHeader = ({ children, className = '' }) => (
  {children}
);

export const CardTitle = ({ children, className = '' }) => (
  {children}
);

export const CardContent = ({ children, className = '' }) => (
  {children}
);
```

### src/components/ui/button.js
```javascript
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
```

### src/components/ui/badge.js
```javascript
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

// src/components/common/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

/**
 * Basic card component that handles the foundational card styling
 * like background, border, shadow, and optional title
 */
const Card: React.FC<CardProps> = ({ children, className = '', title, noPadding = false, style }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-100 ${!noPadding ? 'p-6' : ''} ${className}`} 
      style={{ 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.3s ease',
        ...style
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)')}
    >
      {title && (
        <h3 className="text-lg font-medium text-blue-900 mb-4 border-b border-gray-100 pb-2" style={{ marginTop: '-4px' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
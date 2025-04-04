// src/components/common/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  noPadding?: boolean;
}

/**
 * Basic card component that handles the foundational card styling
 * like background, border, shadow, and optional title
 */
const Card: React.FC<CardProps> = ({ children, className = '', title, noPadding = false }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 ${!noPadding ? 'p-6' : ''} ${className}`}>
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
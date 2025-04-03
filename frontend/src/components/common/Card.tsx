// src/components/common/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  variant?: 'default' | 'kpi';
}

const Card: React.FC<CardProps> = ({ children, className = '', title, variant = 'default' }) => {
  const paddingClass = variant === 'kpi' ? 'py-3 px-4' : 'p-6';
  
  return (
    <div className={`bg-white ${paddingClass} rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 ${className}`}>
      {title && <h3 className="text-lg font-medium text-blue-900 mb-4 border-b border-gray-100 pb-2">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
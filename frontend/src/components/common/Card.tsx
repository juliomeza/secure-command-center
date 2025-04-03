// src/components/common/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
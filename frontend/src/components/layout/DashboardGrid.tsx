// src/components/layout/DashboardGrid.tsx
import React from 'react';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
  allowThreeColumns?: boolean;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ children, className = '', allowThreeColumns = false }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${allowThreeColumns ? '2xl:grid-cols-3' : ''} gap-6 ${className}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;
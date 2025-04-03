// src/components/layout/DashboardGrid.tsx
import React from 'react';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;
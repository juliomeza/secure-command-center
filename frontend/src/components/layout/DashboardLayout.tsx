// src/components/layout/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
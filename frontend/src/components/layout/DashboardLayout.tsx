// src/components/layout/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 pt-2">
          <h1 className="text-2xl font-semibold text-blue-900">Secure Command Center</h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
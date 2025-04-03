// src/components/layout/DashboardLayout.tsx
import React from 'react';
import { useAuth } from '../AuthProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 pt-2">
          <h1 className="text-2xl font-semibold text-blue-900">Secure Command Center</h1>
          <button 
            onClick={logout}
            className="px-5 py-2.5 text-gray-600 hover:text-blue-600 rounded-lg text-sm font-medium bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            Logout
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
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
            style={{
              padding: '0.75rem 1.5rem',
              color: '#6b7280',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.borderBottom = '2px solid #2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.borderBottom = '2px solid transparent';
            }}
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
// frontend/src/components/layout/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="p-6" style={{ backgroundColor: '#f7f9fc', minHeight: 'calc(100vh - 50px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
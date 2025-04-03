// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import TabsNavigation from './common/TabsNavigation';
import CEOView from '../views/CEOView';
import CFOView from '../views/CFOView';
import COOView from '../views/COOView';
import CIOView from '../views/CIOView';

// Define Tab type
type TabId = 'CEO' | 'CFO' | 'COO' | 'CIO';

const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'CEO', label: 'CEO' },
    { id: 'CFO', label: 'CFO' },
    { id: 'COO', label: 'COO' },
    { id: 'CIO', label: 'CIO' },
];

const ExecutiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('CEO');

  const renderContent = () => {
    switch (activeTab) {
      case 'CEO':
        return <CEOView />;
      case 'CFO':
        return <CFOView />;
      case 'COO':
        return <COOView />;
      case 'CIO':
        return <CIOView />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <DashboardLayout>
      {/* Navegación principal con tabs minimalistas */}
      <TabsNavigation<TabId> 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Main Dashboard Content Area */}
      {renderContent()}
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;
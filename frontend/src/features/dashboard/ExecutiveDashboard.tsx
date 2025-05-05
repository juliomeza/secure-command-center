// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import TabsNavigation from './navigation/TabsNavigation';
import CEOView from './views/CEOView';
import CFOView from './views/CFOView';
import COOView from './views/COOView';
import CIOView from './views/CIOView';
import LeadersView from './views/LeadersView';
import TestingView from './views/TestingView'; // <<< Added import for TestingView
import DataCardView from './views/DataCardView'; // <<< Added import for DataCardView
import { useAuth } from '../../auth/components/AuthProvider';
import {
  BarChart2, DollarSign, Settings, Monitor, Users, TestTubeDiagonal, FileSpreadsheet
} from 'lucide-react';

type DashboardTabId = 'CEO' | 'CFO' | 'COO' | 'CIO' | 'LEADERS' | 'TESTING' | 'DATACARD'; // Added DATACARD

const iconProps = {
  size: 18,
  strokeWidth: 1.5
};

const allDashboardTabs: Array<{ id: DashboardTabId; label: string; icon: React.ReactNode }> = [
  { id: 'CEO', label: 'CEO', icon: <BarChart2 {...iconProps} /> },
  { id: 'CFO', label: 'CFO', icon: <DollarSign {...iconProps} /> },
  { id: 'COO', label: 'COO', icon: <Settings {...iconProps} /> },
  { id: 'CIO', label: 'CIO', icon: <Monitor {...iconProps} /> },
  { id: 'LEADERS', label: 'Leaders', icon: <Users {...iconProps} /> },
  { id: 'TESTING', label: 'Testing', icon: <TestTubeDiagonal {...iconProps} /> }, // Added TESTING tab
  { id: 'DATACARD', label: 'DataCard', icon: <FileSpreadsheet {...iconProps} /> }, // Added DataCard tab
];

const ExecutiveDashboard: React.FC = () => {
  const { allowedTabs, isLoading: isLoadingAuth, isAuthorized } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTabId | null>(null);

  const permittedTabs = useMemo(() => {
    if (!allowedTabs) {
      return [];
    }
    // Ensure comparison is case-insensitive and matches backend id_name
    const allowedIds = new Set(allowedTabs.map(tab => tab.id_name.toUpperCase()));
    return allDashboardTabs.filter(tab => allowedIds.has(tab.id));
  }, [allowedTabs]);

  useEffect(() => {
    // Only set active tab if it hasn't been set yet and permissions are loaded
    if (!isLoadingAuth && permittedTabs.length > 0 && activeTab === null) {
      setActiveTab(permittedTabs[0].id);
    }
    // If the current activeTab is no longer permitted (e.g., permissions changed), reset
    if (!isLoadingAuth && activeTab !== null && !permittedTabs.some(tab => tab.id === activeTab)) {
        setActiveTab(permittedTabs.length > 0 ? permittedTabs[0].id : null);
    }
  }, [isLoadingAuth, permittedTabs, activeTab]);

  const renderContent = () => {
    if (isLoadingAuth) {
      return <div>Loading dashboard...</div>;
    }
    if (!isAuthorized) {
        return <div>You are not authorized to view this application.</div>;
    }
    if (permittedTabs.length === 0) {
      return <div>You do not have access to any dashboard views.</div>;
    }
    if (activeTab === null) {
        // This state should ideally be brief or indicate no permitted tabs
        return <div>Loading view or no view selected...</div>;
    }

    switch (activeTab) {
      case 'CEO': return <CEOView />;
      case 'CFO': return <CFOView />;
      case 'COO': return <COOView />;
      case 'CIO': return <CIOView />;
      case 'LEADERS': return <LeadersView />;
      case 'TESTING': return <TestingView />; // Added TESTING case
      case 'DATACARD': return <DataCardView />; // Added DATACARD case
      default: return <div>Invalid tab selected.</div>;
    }
  };

  return (
    <DashboardLayout>
      {/* Render TabsNavigation only if not loading, authorized, and there is an active tab */}
      {!isLoadingAuth && isAuthorized && activeTab !== null && permittedTabs.length > 0 && (
        <TabsNavigation<DashboardTabId>
          tabs={permittedTabs}
          activeTab={activeTab} // Now guaranteed to be non-null here
          onTabChange={setActiveTab} // Direct assignment is fine now
          showIcons={true}
        />
      )}

      {/* Main Dashboard Content Area */}
      {renderContent()}
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;
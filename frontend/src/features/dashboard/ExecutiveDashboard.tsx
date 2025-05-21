// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import TabsNavigation from './navigation/TabsNavigation';
import CEOView from './views/CEOView';
import CFOView from './views/CFOView';
import COOView from './views/COOView';
import CIOView from './views/CIOView';
import LeadersView from './views/LeadersView';
import TestingView from './views/TestingView';
import DataCardView from './views/DataCardView';
import ChatView from './views/ChatView';
import { useAuth } from '../../auth/components/AuthProvider';
import {
  BarChart2, DollarSign, Settings, Monitor, Users, TestTubeDiagonal, FileSpreadsheet, MessageCircle
} from 'lucide-react';

// Add 'CHAT' to DashboardTabId type
type DashboardTabId = 'CEO' | 'CFO' | 'COO' | 'CIO' | 'LEADERS' | 'TESTING' | 'DATACARD' | 'CHAT';

const iconProps = {
  size: 18,
  strokeWidth: 1.5
};

// Add Chat tab to allDashboardTabs
const allDashboardTabs: Array<{ id: DashboardTabId; label: string; icon: React.ReactNode }> = [
  { id: 'CEO', label: 'CEO', icon: <BarChart2 {...iconProps} /> },
  { id: 'CFO', label: 'CFO', icon: <DollarSign {...iconProps} /> },
  { id: 'COO', label: 'COO', icon: <Settings {...iconProps} /> },
  { id: 'CIO', label: 'CIO', icon: <Monitor {...iconProps} /> },
  { id: 'LEADERS', label: 'Leaders', icon: <Users {...iconProps} /> },
  { id: 'TESTING', label: 'Testing', icon: <TestTubeDiagonal {...iconProps} /> },
  { id: 'DATACARD', label: 'DataCard', icon: <FileSpreadsheet {...iconProps} /> },
  { id: 'CHAT', label: 'Chat', icon: <MessageCircle {...iconProps} /> },
];

const ExecutiveDashboard: React.FC = () => {
  const { allowedTabs, isLoading: isLoadingAuth, isAuthorized } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTabId | null>(null);
  const [chatResetKey, setChatResetKey] = useState(0);

  // Compute permittedTabs and dynamically change Chat label if active
  const permittedTabs = useMemo(() => {
    if (!allowedTabs) {
      return [];
    }
    const allowedIds = new Set(allowedTabs.map(tab => tab.id_name.toUpperCase()));
    return allDashboardTabs
      .filter(tab => allowedIds.has(tab.id))
      .map(tab =>
        tab.id === 'CHAT' && activeTab === 'CHAT'
          ? { ...tab, label: '+ New Chat' }
          : tab
      );
  }, [allowedTabs, activeTab]);

  useEffect(() => {
    if (!isLoadingAuth && permittedTabs.length > 0 && activeTab === null) {
      setActiveTab(permittedTabs[0].id);
    }
    if (!isLoadingAuth && activeTab !== null && !permittedTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(permittedTabs.length > 0 ? permittedTabs[0].id : null);
    }
  }, [isLoadingAuth, permittedTabs, activeTab]);

  // Custom tab change handler to support chat reset
  const handleTabChange = (tabId: DashboardTabId) => {
    if (tabId === 'CHAT' && activeTab === 'CHAT') {
      setChatResetKey(prev => prev + 1); // Reset chat
    } else {
      setActiveTab(tabId);
    }
  };

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
      return <div>Loading view or no view selected...</div>;
    }

    switch (activeTab) {
      case 'CEO': return <CEOView />;
      case 'CFO': return <CFOView />;
      case 'COO': return <COOView />;
      case 'CIO': return <CIOView />;
      case 'LEADERS': return <LeadersView />;
      case 'TESTING': return <TestingView />;
      case 'DATACARD': return <DataCardView />;
      case 'CHAT': return <ChatView key={chatResetKey} />; // Pass key to force remount
      default: return <div>Invalid tab selected.</div>;
    }
  };

  return (
    <DashboardLayout>
      {/* Render TabsNavigation only if not loading, authorized, and there is an active tab */}
      {!isLoadingAuth && isAuthorized && activeTab !== null && permittedTabs.length > 0 && (
        <TabsNavigation<DashboardTabId>
          tabs={permittedTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showIcons={true}
        />
      )}

      {/* Main Dashboard Content Area */}
      {renderContent()}
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;
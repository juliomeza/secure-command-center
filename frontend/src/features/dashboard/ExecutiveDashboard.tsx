// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import TabsNavigation from './navigation/TabsNavigation';
import CEOView from './views/CEOView';
import CFOView from './views/CFOView';
import COOView from './views/COOView';
import CIOView from './views/CIOView';
import LeadersView from './views/LeadersView';
// Importamos iconos de Lucide para cada rol ejecutivo
import { 
  BarChart2, // CEO - Indicadores generales
  DollarSign, // CFO - Finanzas
  Settings, // COO - Operaciones
  Monitor, // CIO - Tecnología
  Users // Leaders - Warehouse Managers
} from 'lucide-react';

// Define Tab type
type TabId = 'CEO' | 'CFO' | 'COO' | 'CIO' | 'LEADERS';

// Icon configuration
const iconProps = {
  size: 18,
  strokeWidth: 1.5
};

// Tab definition with icons
const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'CEO', label: 'CEO', icon: <BarChart2 {...iconProps} /> },
  { id: 'CFO', label: 'CFO', icon: <DollarSign {...iconProps} /> },
  { id: 'COO', label: 'COO', icon: <Settings {...iconProps} /> },
  { id: 'CIO', label: 'CIO', icon: <Monitor {...iconProps} /> },
  { id: 'LEADERS', label: 'Leaders', icon: <Users {...iconProps} /> },
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
      case 'LEADERS':
        return <LeadersView />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <DashboardLayout>
      {/* Main navigation with minimalist tabs and icons */}
      <TabsNavigation<TabId> 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        showIcons={true}
      />

      {/* Main Dashboard Content Area */}
      {renderContent()}
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;